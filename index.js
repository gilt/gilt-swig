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
  require('colors');

  var _ = require('underscore'),
    path = require('path'),
    os = require('os'),
    fs = require('fs'),
    argv = require('yargs').argv,
    target,
    targetName,
    taskDeps,
    taskName = argv._.length > 0 ? argv._[0] : 'default',
    thisPkg = require('./package.json'),
    swig = {
      pkg: {},
      gulp: gulp,
      argv: argv,
      project: {},
      env: process.env.GILT_ENV || 'development',
      target: {},
      tasks: {}
    };

  function load (moduleName) {

    if (argv.verbose) {
      console.log('Loading: ' + moduleName);
    }

    var module = require(moduleName)(gulp, swig) || {};

    module.path = path.dirname(require.resolve(moduleName));
    module.pkg = require(path.join(module.path, '/package.json'));

    return module;
  }

  function loadAssetTasks () {
    taskDeps = _.filter(Object.keys(thisPkg.dependencies), function (moduleName) {
      return /^\@gilt-tech\/swig\-(?!util)/.test(moduleName);
    });

    taskDeps.forEach(load);
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
      swig.log.error('swig', '.swigrc not found at: ' + '~/.swigrc'.grey + '. Please grab a copy from ' + '/web/tools/config/user.\n'.grey);
      swig.log('   .swigrc is required because it contains internal information that swig needs.');
      process.exit(1);
    }
    else {
      swig.rc = JSON.parse(fs.readFileSync(rcPath));
    }
  }

  function findTarget () {

    var target,
      repo = swig.argv.repo || '';

    if (swig.argv.m) {
      swig.argv.module = swig.argv.m;
    }

    if(swig.argv.module) {
      target = path.join('src', swig.argv.module.replace(/\./g, '/'));

      if (repo) {
        target = path.join('/web/', repo, target);
      }
      else {
        target = path.join(swig.cwd, target);
      }

      if (!fs.existsSync(target)) {
        swig.log();
        swig.log.error('The module specified doesn\'t exist in this repository.');
        console.log(target);
        process.exit(1);
      }

      swig.project.type = 'module';
    }
    else {
      target = repo ? path.join('/web/', repo) : swig.cwd;

      swig.project.type = 'webapp';
    }

    var packagePath = path.join(target, 'package.json');

    if (fs.existsSync(packagePath)) {
      swig.pkg = require(packagePath);
    }

    if (_.isEmpty(swig.pkg)) {
      console.log('.  ' + 'warning!    '.yellow + ' package.json not found at: ' + packagePath.grey);
    }

    swig.target = {
      path: target,
      name: swig.argv.module || (swig.pkg && swig.pkg.name) || path.basename(target),
      repo: swig.argv.repo || path.basename(swig.cwd)
    };
  }

  // allows a task to tell swig about itself
  function tell (taskName, taskInfo) {
    if (swig.tasks[taskName]) {
      console.log(`Task '${taskName}' has been overridden by a local installation`.yellow);
    }

    taskInfo = _.extend({
      description: '<unknown>',
      flags: {},
    }, taskInfo);

    swig.tasks[taskName] = taskInfo;
  }

  function checkLocalVersion () {

    var semverDiff = require('semver-diff'),
      strip = require('strip-ansi'),
      repeating = require('repeating'),

      line1 = 'Local update available: ' + process.env.SWIG_VERSION + (' (current: ' + thisPkg.version + ')').gray,
      line2 = 'Run ' + 'npm update @gilt-tech/swig'.blue + ' to update',
      line1Len = strip(line1).length,
      line2Len = strip(line2).length,
      maxLen = Math.max(line1Len, line2Len),
      top = repeating('─', maxLen + 4);

    if (!semverDiff(thisPkg.version, process.env.SWIG_VERSION)) {
      return;
    }

    if (maxLen > line1Len){
      line1 += repeating(' ', maxLen - line1Len);
    }
    else if (maxLen > line2Len) {
      line2 += repeating(' ', maxLen - line2Len);
    }

    console.log('┌' + top +       '┐');
    console.log('│  '.yellow + line1 + '  │'.yellow);
    console.log('│  '.yellow + line2 + '  │'.yellow);
    console.log('└' + top +      '┘');

    console.log('·');
  }

  console.log('·  ' + 'swig (local)'.red + ' v' + thisPkg.version + '\n·');

  swig.util = require('@gilt-tech/swig-util')(swig, gulp);
  swig.tell = tell;

  findSwigRc();
  checkLocalVersion();
  setupPaths();
  findTarget();

  targetName = swig.target.name;

  console.log('·  ' + 'gulpfile:    '.blue + module.parent.id.replace(process.env.HOME, '~').grey);
  console.log('·  ' + 'target:      '.blue + (targetName ? targetName.grey : 'NO TARGET'.yellow));
  console.log('·  ' + 'target-path: '.blue + swig.target.path.grey + '\n');

  // create swigs's temporary directory;
  if (!fs.existsSync(swig.temp)) {
    fs.mkdirSync(swig.temp);
  }

  loadAssetTasks();

  return swig;
};
