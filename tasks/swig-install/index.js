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
    path = require('path'),
    fs = require('fs'),
    co = require('co'),
    installCommand = 'npm install --tag=null --loglevel=info 2>&1',
    buffer,
    errors,
    regex = {
      requested: /npm\shttp[s]?\s([\d]+|GET)\s(.+)/,
      installed: /npm\sinfo\sinstall\s((.+)\@([\d|\.]+))$/,
      error: /npm\sERR\!\sError\:\s(.+)/
    },
    downloaded = [];

  // processes output from npm install commands
  function process (line) {

    line = swig.log.strip(line).trim();

    swig.log.verbose(line);

    var matches,
      moduleName;

    if (regex.requested.test(line)) {
      matches = line.match(regex.requested);
      moduleName = matches[2].substring(matches[2].lastIndexOf('/') + 1);

      swig.log.verbose(swig.log.padding + swig.log.padding + '→'.white + '  ' + moduleName);
    }
    else if (regex.installed.test(line)) {
      matches = line.match(regex.installed);
      moduleName = matches[1].replace('@', ' v');

      if (_.indexOf(downloaded, moduleName) === -1) {
        downloaded.push(moduleName);

        swig.log(swig.log.padding + swig.log.padding + swig.log.symbols.success + '  ' + moduleName);
      }
    }
    else if (regex.error.test(line)) {
      matches = line.match(regex.error);

      swig.log();
      swig.log.error('install', matches[1]);

      if (matches[1].indexOf('@') > -1) {
        swig.log('\nTry specifying a different version. use `npm info <module>` to display available versions for a module.\n');
      }
    }
  }

  function * local() {
    if (swig.argv.module) {
      swig.log.info('', 'Skipping Local Node Modules');
      return;
    }

    var pkg = swig.pkg;

    swig.log.task('Installing Local Node Modules');

    if (!pkg.dependencies || _.isEmpty(pkg.dependencies)) {
      swig.log.warn(null, 'package.json doesn\'t contain any dependencies, nothing to install.\n');
      return;
    }

    var output = yield swig.exec(installCommand, null, {
      stdout: function (data) {
        process(data);
      }
    });

    if (output.stdout.indexOf('not ok') > -1){
      swig.log.error('install:local', 'One or more modules failed to install from npm.\n ' +
        swig.log.padLeft('For more info, look here: ' + path.join(swig.temp, 'npm_debug.log').grey, 7));
    }

    swig.log();
  }

  function * ui () {
    var pkg = swig.pkg;

    swig.log.task('Installing Gilt UI Dependencies');

    if (!swig.argv.module && (!pkg.gilt || !pkg.gilt.uiDependencies)) {
      swig.log.warn(null, 'package.json doesn\'t contain any uiDependencies, nothing to install.\n');
      return;
    }

    var commands = [
      'cd ' + swig.temp,
      'rm -rf node_modules',
      installCommand
    ];

    var output = yield swig.exec(commands.join('; '), null, {
      stdout: function (data) {
        process(data);
      }
    });

    if (output.stdout.indexOf('not ok') > -1){
      swig.log.error('install:ui', 'One or more modules failed to install from npm.\n ' +
        swig.log.padLeft('For more info, look here: ' + path.join(swig.temp, 'npm_debug.log').grey, 7));
    }

    swig.log();
  }

  gulp.task('install', co(function *() {

    if (!swig.pkg) {
      swig.log.error('install', 'Couldn\'t find package.json, not installing anything.');
      return;
    }

    var processPublic = require('./lib/public-directory')(gulp, swig),
      packageMerge = require('./lib/package-merge')(gulp, swig),
      mergeModules = require('./lib/merge-modules')(gulp, swig);

    packageMerge();
    yield local();
    yield ui();
    mergeModules();
    processPublic();

    swig.log.success('Install Complete');

  }));
};