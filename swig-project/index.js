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

module.exports = function (gulp) {

  var _ = require('underscore'),
    path = require('path'),
    os = require('os'),
    fs = require('fs'),
    argv = require('yargs').argv,
    taskName = argv._.length > 0 ? argv._[0] : 'default',
    thisPkg = require('./package.json'),
    swig = {
      pkg: {},
      gulp: gulp,
      argv: argv,
      project: {},
      env: process.env.GILT_ENV || 'development'
    };

  require('colors');
  console.log('·  ' + 'swig-project'.red + ' v' + thisPkg.version + '\n·');
  console.log('·  ' + 'gulpfile:    '.blue + module.parent.id.replace(process.env.HOME, '~').grey);

  function load (moduleName) {

    if (argv.verbose) {
      console.log('Loading: ' + moduleName);
    }

    var module = require(moduleName)(gulp, swig) || {};

    module.path = path.dirname(require.resolve(moduleName));
    module.pkg = require(path.join(module.path, '/package.json'));

    try {
      module.swigInfo = require(path.join(module.path, '/swig.json'));
    }
    catch (e) {
      if (e.code != 'MODULE_NOT_FOUND') {
        throw e;
      }
    }

    return module;
  }

  function setupPaths () {
    var fs = require('fs'),
      path = require('path'),
      swigPath = path.join(process.env.HOME, '.swig');

    if (!fs.existsSync(swigPath)) {
      fs.mkdirSync(swigPath);
    }

    swig.home = swigPath;
    swig.cwd = process.cwd();
    swig.temp = path.join(os.tmpdir(), 'swig');
  }

  function findSwigRc() {
    var rcPath = path.join(process.env.HOME, '/.swigrc');

    if (!fs.existsSync(rcPath)) {
      swig.log.warn('swig-project', '.swigrc not found at: ' + '~/.swigrc'.grey + '. Please grab a copy from ' + '/web/tools/config.\n'.grey);
    }
    else {
      swig.rc = JSON.parse(fs.readFileSync(rcPath));
    }
  }

  function findTarget () {

    var target,
      moduleName,
      repo = swig.argv.repo || '';

    if(swig.argv.module) {
      target = path.join('src', swig.argv.module.replace(/\./g, '/'));

      if (repo) {
        target = path.join('/web/', repo, target);
      }
      else {
        target = path.join(swig.cwd, target);
      }

      swig.project.type = 'module';
    }
    else {
      target = repo ? path.join('/web/', repo) : swig.cwd;

      swig.project.type = 'webapp';
    }

    swig.target = {
      path: target,
      name: path.basename(target)
    };

    console.log('·  ' + 'target:      '.blue + swig.target.name.grey);
    console.log('·  ' + 'target-path: '.blue + swig.target.path.grey + '\n');
  }

  function findPackage () {

    var packagePath = path.join(swig.target.path, 'package.json')

    if (fs.existsSync(packagePath)) {
      swig.pkg = require(packagePath);
    }
    else {
      swig.log('[swig-project]'.yellow + ' package.json not found at: ' + packagePath.grey);
    }
  }

  swig.util = require('swig-util')(swig, gulp);
  swig.log = require('swig-log')(swig);

  setupPaths();
  findTarget();
  findPackage();
  findSwigRc();

  // create swigs's temporary directory;
  if (!fs.existsSync(swig.temp)) {
    fs.mkdirSync(swig.temp);
  }

  swig = _.extend(swig, {
    tools: {
      run: load('swig-run'),
      'app-registry': load('swig-app-registry'),
      tunnel: load('swig-tunnel'),
      zk: load('swig-zk')
    }
  });

  // if the requested task is a tool, stop loading things.
  if (_.has(swig.tools, taskName)) {
    return swig;
  }

  swig = _.extend(swig, {
    tasks: {
      bundle: load('swig-bundle'),
      'default': load('swig-default'),
      deploy: load('swig-deploy'),
      install: load('swig-install'),
      lint: load('swig-lint'),
      publish: load('swig-publish'),
      spec: load('swig-spec'),
      stub: load('swig-stub')
    }
  });

  return swig;
};
