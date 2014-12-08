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

// handles writing of main.less in /public
module.exports = function (gulp, swig, paths, azModules) {

  // dependencies.less should be in topoclogical order, not a-z
  var _ = require('underscore'),
    fs = require('fs'),
    glob = require('glob'),
    path = require('path'),
    now = (new Date()).toString(),
    content = '/* Generated: ' + now + '\n   This file is auto-generated during ui:install\n   It is inadvisable to write to it directly */\n',
    depsPath = path.join(paths.css, 'dependencies.less'),
    mainCssPath = path.join(paths.css, 'main.less'),
    modPathName,
    sourcePath;

    _.uniq(azModules, function (mod) { return mod.name; }).forEach(function (mod) {
      modPathName = mod.name.replace(/\./g, '/');
      sourcePath = path.join(mod.path, '/css');

      glob.sync(path.join(sourcePath, '/**/*.*')).forEach(function (file) {
        content += '@import "' + modPathName + '/' + path.relative(sourcePath, file) + '";\n'
      });
    });

    swig.log.info('', 'Writing dependencies.less to:');

    fs.writeFileSync(depsPath, content);

    swig.log(swig.log.padLeft(depsPath.grey, 2));

    if (!fs.existsSync(mainCssPath)) {
      swig.log();
      swig.log.info('', 'Didn\'t find main.less, Writing main.less to:');

      content = '// Generated: ' + now + '\n@import "dependencies.less";';
      fs.writeFileSync(mainCssPath, content);

      swig.log(swig.log.padLeft(' ' + mainCssPath.grey + '\n', 1));
    }
    else {
      swig.log.info('', 'main.less already exists, skipping it.');
    }

};
