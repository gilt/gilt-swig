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

// handles building of the /public assets directory
module.exports = function (gulp, swig) {

  var _ = require('underscore'),
    fs = require('fs'),
    glob = require('globby'),
    rimraf = require('rimraf'),
    path = require('path'),
    modules = {},
    azModules = [], // alphabetically sorted
    now;

  // remove everything in /public except for /public/src and /public/main.less
  function clean () {
    swig.log.info('', 'Cleaning the /public directory...');

    var paths = [
        './public/**/{target}/**/*',
        '!./public/**/{target}/**/config',
        '!./public/**/{target}/**/config/**/*',
        '!./public/**/{target}/**/src',
        '!./public/**/{target}/**/src/**/*',
        '!./public/css/{target}/main.less'
      ],
      files;

    paths = _.map(paths, function (p) { return p.replace('{target}', swig.pkg.name); });
    files = glob.sync(paths);

    swig.log.verbose('[clean] ' + files.length + ' files found at: ');
    swig.log.verbose(paths);

    _.each(files, function (file) {
      swig.log.verbose('[clean] removing: ' + file);
      rimraf.sync(path.normalize(file));
    });
  }

  // find and compile a list of all unique modules, and their paths
  function compile () {

    swig.log.info('', 'Compiling module list...');

    var modulesPath = path.join(swig.temp, '/**/node_modules'),
      modPaths = glob.sync(modulesPath),
      dirs;

    swig.log.verbose('[compile] searching: ' + modulesPath);
    swig.log.verbose('[compile] found module directories: ' + modPaths.length);

    modPaths.forEach(function (modPath) {
      swig.log.verbose('[compile] compiling: ' + modPath);

      dirs = fs.readdirSync(modPath);

      _.each(dirs, function (dir){
        var dirPath = path.join(modPath, dir);
        if (fs.existsSync(dirPath) && fs.lstatSync(dirPath).isDirectory()) {
          azModules.push({ name: dir, path: dirPath });
        }
      });
    });

    // and now we pretty sort a-z for various output
    // we dont reset azModules to the sorted array because we need it dirty for deps.less
    _.sortBy(azModules, function (mod) { return mod.name; }).forEach(function (mod) {
      modules[mod.name] = mod.path;
    });

    swig.log.verbose('[compile] sorted modules: ');
    swig.log.verbose(modules);
  }

  function copy (paths) {

    var destPath,
      sourcePath,
      modPathName;

    if (swig.argv.module) {
      swig.log.info('', 'Copying ' + swig.argv.module + ' to temp...');

      destPath = path.join(swig.temp, 'node_modules', swig.argv.module);
      sourcePath = path.join(swig.target.path);

      swig.fs.copyAll(sourcePath, destPath);
      modules[swig.argv.module] = destPath;
    }

    swig.log.info('', 'Copying modules to /public...');
    swig.log.verbose('');

    _.each(modules, function (modPath, name) {
      modPathName = name.replace(/\./g, '/');

      _.each(paths, function (p, pathName) {
        sourcePath = path.join(modPath, pathName);

        swig.log.verbose('\n[copy] copying: ' + sourcePath);

        if (fs.existsSync(sourcePath)) {
          destPath = path.join(p, modPathName);

          if (fs.existsSync(destPath)) {
            rimraf.sync(destPath);
          }

          swig.fs.mkdir(destPath);
          swig.fs.copyAll(sourcePath, destPath);
          swig.log.verbose('[copy] copied: ' + destPath);
        }
      })
    });
  }

  function manifest (paths) {
    // re-prep the modules hash with version numbers instead of paths

    var pkg,
      manifestPath = path.join(paths.js, 'manifest.json');

    _.each(modules, function (mod, name) {
      pkg = require(path.join(mod, '/package.json'));
      modules[name] = pkg.version;
    });

    swig.log.info('', 'Writing manifest.json to:');
    swig.log(swig.log.padLeft(manifestPath.grey, 2));

    fs.writeFileSync(manifestPath, JSON.stringify({ generated: now, dependencies: modules }, null, 2));
  }

  function replace (paths) {

    swig.log.info('', 'Replacing Public Repo Name in CSS...');

    glob.sync(path.join(paths.css, '/**/*.css')).forEach(function (file) {
      var content = fs.readFileSync(file, { encoding: 'utf-8' }),
        matches = content.match(/\$\$PUBLIC\_REPO\_NAME\$\$/g);

      if (matches && matches.length) {
        content = content.replace(/\$\$PUBLIC\_REPO\_NAME\$\$/g, swig.pkg.name);
        fs.writeFileSync(file, content);
        swig.log(swig.log.padLeft(file.grey, 2));
      }
    });
  }

  function vendor (paths) {
    var destPath;

    swig.log.info('', 'Copying internal modules to vendor/common...');

    glob.sync(path.join(paths.js, '/internal/**/*.js')).forEach(function (file) {
      destPath = path.join(paths.js, '/vendor/common/', path.basename(file));

      if (!fs.existsSync(path.dirname(destPath))) {
        swig.fs.mkdir(path.dirname(destPath));
      }

      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
      }

      fs.linkSync(file, destPath);
    });

    swig.log.info('', 'Copying less helpers common/helpers...');

    glob.sync(path.join(paths.css, '/less/helpers/*.less')).forEach(function (file) {
      destPath = path.join(paths.css, '/common/helpers/', path.basename(file));

      if (!fs.existsSync(path.dirname(destPath))) {
        swig.fs.mkdir(path.dirname(destPath));
      }

      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
      }

      fs.linkSync(file, destPath);
    });
  }

  return function process () {

    now = (new Date()).toString();

    var path = require('path'),
      pkg = swig.pkg,
      paths = { pub: path.join(swig.target.path, '/public') },
      less = require('./less'),
      mainJs = require('./main-js');

    // we may have tasks for ui-* repos which need an install.
    // so let's install, but keep everything in a temp directory
    if (swig.argv.module) {
      paths.pub = path.join(swig.temp, 'install', swig.argv.module, 'public');
    }

    if (pkg.name) {
      paths = {
        css: path.join(paths.pub, '/css/', pkg.name),
        img: path.join(paths.pub, '/img/', pkg.name),
        js: path.join(paths.pub, '/js/', pkg.name),
        templates: path.join(paths.pub, '/templates/', pkg.name)
      };
    }
    else {
      swig.log.error('install:public-directory', 'package.json is missing the "name" property.');
      return;
    }

    swig.log.task('Processing node_modules → /public')

    clean();
    compile();
    copy(paths);
    manifest(paths);
    less(gulp, swig, paths, azModules);
    replace(paths);
    vendor(paths);
    mainJs(gulp, swig, paths);
  };
};
