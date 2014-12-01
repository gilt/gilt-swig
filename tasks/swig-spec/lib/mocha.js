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

  var _ = require('underscore'),
    mocha = require('gulp-mocha-phantomjs'),
    fs = require('fs'),
    path = require('path'),
    through = require('through2'),
    mustache = require('mustache'),
    file = require('gulp-file'),
    glob = require('glob'),
    mochaPath = glob.sync(path.join(__dirname, '../**/mocha'))[0],

    // we have to reference this reporter by file path rather than name
    // due to a compliation problem with the Prototype
    nyanPath = path.join(mochaPath, '/lib/reporters/nyan.js'),

    chaiPath = path.dirname(require.resolve('chai')),
    sinonPath = path.join(path.dirname(require.resolve('sinon')), '../pkg'),
    runnerPath = path.join(__dirname, '../templates/mocha-runner.html'),
    runner = fs.readFileSync(runnerPath, 'utf-8'),
    specFiles = [],
    specs = [],
    scripts = [],
    specsPath = path.join(swig.target.path, 'public/spec/', swig.pkg.name),
    srcPath;

  if (swig.project.type === 'webapp') {
    srcPath = path.join(swig.target.path, 'public/js/', swig.pkg.name);
  }
  else {
    srcPath = path.join(swig.target.path, 'public/js/');
  }

  _.each(['browser_detect', 'json', 'modernizr', 'require', 'gilt_require'], function (module) {
    scripts.push(path.join(__dirname, '../node_modules/internal.' + module, 'js', module + '.js'));
  })

  swig.log.success('', 'Enumerating Specs...');

  // enum all of the files in the specs directory
  specFiles = glob.sync(path.join(specsPath, '/**/*.js'));

  // the file names should correspond with the name of the module used in gilt.define
  // this is used to `require` the test files and THEN launch mocha
  _.each(specFiles, function (file) {
    specs.push('\'' + path.basename(file, path.extname(file)) + '\'');
  });

  swig.log.success('', 'Rendering Runner...\n');

  runner = mustache.render(runner, {
    baseUrl: srcPath,
    scripts: scripts,
    specs: specs.join(','),
    specFiles: specFiles,
    mochaPath: mochaPath,
    chaiPath: chaiPath,
    sinonPath: sinonPath
  });

  swig.log.task('Running PhantomJS+Mocha');
  swig.log('');

  return file('runner.html', runner, { src: true })
    .pipe(gulp.dest(specsPath))
    .pipe(mocha({
      reporter: nyanPath,
      silent: true,
      phantomjs: { webSecurityEnabled: false }
    }));

};
