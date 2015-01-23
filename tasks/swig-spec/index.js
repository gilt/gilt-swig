'use strict';
/*
 ________  ___       __   ___  ________
|\   ____\|\  \     |\  \|\  \|\   ____\
\ \  \___|\ \  \    \ \  \ \  \ \  \___|
 \ \_____  \ \  \  __\ \  \ \  \ \  \  ___
  \|____|\  \ \  \|\__\_\  \ \  \ \  \|\  \
    ____\_\  \ \____________\ \__\ \_______\
   |\_________\|____________|\|__|\|_______|
   \|_________|

   It's delicious.
   Brought to you by the fine folks at Gilt (http://github.com/gilt)
*/

module.exports = function (gulp, swig) {

  if (!swig.pkg) {
    return;
  }

  var _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    glob = require('globby'),
    concat = require('gulp-concat'),
    tap = require('gulp-tap'),
    wrap = require('gulp-wrap'),
    scripts = [],
    servers, // populated by mock-apidoc task

    waterfall = [
      'lint',
      'spec-before',
      'spec-templates',
      'spec-mock-apidoc',
      'spec-run'
    ];

  function copyModules (paths, tempPath) {

    swig.log.info('', 'Copying modules to /public...');
    swig.log.verbose('');

    var destPath,
      sourcePath,
      modPathName;

    _.each(modules, function (modPath, name) {
      modPathName = name.replace(/\./g, '/');

      _.each(paths, function (p, pathName) {
        sourcePath = path.join(modPath, pathName);

        swig.log.verbose('\n[copy] copying: ' + sourcePath);

        if (fs.existsSync(sourcePath)) {
          destPath = path.join(p, modPathName);
          swig.fs.mkdir(destPath);
          swig.fs.copyAll(sourcePath, destPath);
          swig.log.verbose('[copy] copied: ' + destPath);
        }
      })
    });

    swig.log.success(null, 'Done\n');
  }

  gulp.task('spec', function (done) {

    var specsPath = path.join(swig.target.path, 'public/spec/', swig.pkg.name);

    if (swig.project.type !== 'webapp') {
      // if we're in a ui-* modules repo
      specsPath = path.join(swig.target.path, 'spec/');
    }

    if (!fs.existsSync(specsPath)) {
      swig.seq(
        'lint',
        function () {
          swig.log.task('Imagining That Specs Exist');
          swig.log.info('', 'Aw boo. No specs to run!');

          done();
        }
      );
      return;
    }

    var installTask = 'install-noop';

    if (swig.argv.module) {
      // tell `install` that we need devDependencies too. this needs to be executed BEFORE install.
      swig.argv.devDependencies = true;
      installTask = 'install';
    }

    swig.seq(
      installTask,
      'lint',
      'spec-setup',
      'spec-mock-apidoc',
      'spec-templates',
      'spec-run',
      done
    );

  });

  gulp.task('spec-setup', function (done) {

    swig.log.task('Initializing Specs');

    swig.log.info('', 'Enumerating Dependencies...');

    // _.each(['browser_detect', 'json', 'modernizr', 'require', 'gilt_require'], function (module) {
    //   scripts.push(path.join(__dirname, 'node_modules/internal.' + module, 'js', module + '.js'));
    // });

    // add main.js to the mix.
    scripts.push(path.join(swig.temp, 'install', swig.pkg.name, 'public/js/', swig.pkg.name, 'main.js'));

    done();
  });

  gulp.task('spec-mock-apidoc', function (done) {

    swig.log.info('', 'Enumerating Mock API (apidoc)');

    var tap = require('gulp-tap'),
      mock = require('./lib/mock-apidoc.js');

    gulp.src(path.join(swig.target.path, '/json/mock/**/*.json'))
      .pipe(mock())
      .pipe(tap(function(file, t) {
        try {
          var fileServers = JSON.parse(file.contents);
          servers = _.filter(_.union(servers, fileServers), function(a) { return typeof a !== 'undefined'; });
        }
        catch (e) {
          console.log(e);
        }
      }))
      .on('end', done);

  });

  gulp.task('spec-templates', function (done) {

    swig.log.info('', 'Enumerating Templates...');

    var handlebars = require('handlebars'),
      template = path.join(__dirname, '/templates/handlebars-template.lodash'),
      hbsPath = path.join(swig.target.path, 'public/templates/', swig.pkg.name, 'src'),
      destPath = path.join(swig.target.path, 'public/spec/', swig.pkg.name, '/runner'),
      hbsGlob = [
        path.join(hbsPath, '/**/**/*.handlebars'),
        '!' + path.join(hbsPath, '/**/dom.chassis/*.handlebars'),
        '!' + path.join(hbsPath, '/**/nav.unified/*.handlebars'),
        '!' + path.join(hbsPath, '/**/nav.footer/*.handlebars')
      ],
      fileCount = 0;

    gulp.src(hbsGlob)
      .pipe(tap(function (file, t) {

        var contents = file.contents.toString(),
          ast = handlebars.parse(contents),
          compiled = handlebars.precompile(ast, {}).toString(),
          moduleName = swig.pkg.name.replace(/\./g, '/'),
          fileName = path.basename(file.path, path.extname(file.path));

        if (swig.project.type === 'webapp') {
          moduleName = 'src';
          fileName = file.path.replace(hbsPath, '');
          fileName = fileName.replace(path.extname(fileName), '').substring(1);
        }

        compiled = compiled.split('\n').join('\n    ');

        file.contents = new Buffer(
          '\n  Handlebars.templates[\'' + moduleName + '/' + fileName + '\'] = Handlebars.template(\n    ' +
          compiled +
          '\n  );',
          'utf-8'
        );

        fileCount++;
      }))
      .pipe(concat('templates.js'))
      .pipe(wrap({ src: path.join(__dirname, '/templates/handlebars-template.lodash') }))
      .pipe(gulp.dest(destPath))
      .on('end', function () {
        if (fileCount > 0) {
          scripts.push(path.join(destPath, 'templates.js'));
        }
        done();
      });
  });

  gulp.task('spec-run', function (done) {

    var defaultFramework = 'jasmine',
      framework = defaultFramework,
      impl,
      options = {},
      specFiles = [],
      specs = [],
      specsPath = path.join(swig.target.path, 'public/spec/', swig.pkg.name),
      runnerPath,
      requireBasePath = path.join(swig.target.path, 'public/js/', swig.pkg.name),
      tempPath;

    if (swig.project.type !== 'webapp') {
      // if we're in a ui-* modules repo
      tempPath = path.join(swig.temp, 'install', swig.pkg.name);
      specsPath = path.join(swig.target.path, 'spec/');
      requireBasePath = path.join(tempPath, 'public/js/', swig.pkg.name);

      // what we're doing here is telling require to use the files local to /js
      // for the module first, rather than what's in the temp ui-install dir.
      scripts = scripts.concat(glob.sync(path.join(swig.target.path, 'js/**/*.js')));
    }

    runnerPath = path.join(specsPath, '/runner');

    if (!fs.existsSync(runnerPath)) {
      fs.mkdirSync(runnerPath);
    }

    if (swig.pkg.gilt && swig.pkg.gilt.specs && swig.pkg.gilt.specs.framework){
      framework = swig.pkg.gilt.specs.framework;
    }

    try {
      swig.log.info('', 'Loading ' + framework + '...');

      impl = require('./lib/frameworks/' + framework.toLowerCase());
    }
    catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
        swig.log.error('spec', 'Spec Library: ' + framework + ', hasn\'t been implemented.');
        swig.log(e);
      }
      else {
        throw e;
      }
    }

    swig.log.info('', 'Enumerating Specs...');

    // enum all of the files in the specs directory
    specFiles = glob.sync(path.join(specsPath, '/**/*.js'));

    // the file names should correspond with the name of the module used in gilt.define
    // this is used to `require` the test files and THEN launch mocha
    _.each(specFiles, function (file) {
      specs.push('\'' + path.basename(file, path.extname(file)) + '\'');
    });

    options = {
      baseUrl: requireBasePath,
      scripts: scripts,
      runnerPath: runnerPath,
      specs: specs.join(','),
      specsPath: specsPath,
      specFiles: specFiles,
      servers: servers,
      useColors: (swig.argv.pretty !== 'false'),
      targetExperience: swig.argv.targetExperience || 'full'
    };

    // fire our specs implementation (jasmine, mocha, etc..)
    impl(gulp, swig, options, done);
  });
};
