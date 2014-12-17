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

// creates main.js
module.exports = function (gulp, swig, paths) {

  // main.js
  var _ = require('underscore'),
    glob = require('glob'),
    path = require('path'),
    fs = require('fs'),
    now = (new Date()).toString(),
    preamble = '/* Generated: '
      + now
      + '\n   This file is auto-generated during ui:install\n   It is inadvisable to write to it directly */\n',
    templates = {
      main: fs.readFileSync(path.join(__dirname, '../templates/main.js'), { encoding: 'utf-8' }),
      config: fs.readFileSync(path.join(__dirname, '../templates/main-config.js'), { encoding: 'utf-8' })
    },
    files = '',
    destPath,
    pkg,
    configDeps = {},
    config,
    mainjs,
    specjs;

  // pull in raw file contents which need to be inserted into the template
  glob.sync(path.join(paths.js, '/vendor/common/{require,require_wrapper,json}.js')).forEach(function (file) {
    files += fs.readFileSync(file, { encoding: 'utf-8' }) + '\n';
  });

  // load the config dependencies
  glob.sync(path.join(swig.temp, '/**/node_modules/**/package.json')).forEach(function (file) {
    pkg = JSON.parse(fs.readFileSync(file, { encoding: 'utf-8' }));
    if (pkg.configDependencies) {
      _.keys(pkg.configDependencies).forEach(function(key) {
        if (pkg.configDependencies[key] === '') {
          delete pkg.configDependencies[key];
        }
      });
      configDeps = _.extend(configDeps, pkg.configDependencies);
    }
  });

  // TEMPORARY
  configDeps['config.jsBasePath'] = '/a/js/' + swig.pkg.name + '/';

  // handlebars is overkill here, run with a simple replace.
  templates.main = templates.main
                    .replace('{{preamble}}', preamble)
                    .replace('{{files}}', files);

  config = templates.config.replace('{{configs}}', JSON.stringify(configDeps || {}, null, '  '));
  mainjs = templates.main.replace('{{config}}', config);

  // create a js file separately that'll be used to run specs
  specjs = templates.main.replace('{{config}}', '');
  specjs = '/* This file is only used to run specs. */\n' + specjs;

  swig.log.info('', 'Writing main.js to:');

  destPath = path.join(paths.js, 'main.js');
  fs.writeFileSync(destPath, mainjs);

  swig.log(swig.log.padLeft(destPath.grey, 2));

  swig.log.info('', 'Writing main-spec.js to:');

  destPath = path.join(paths.js, 'main-spec.js');
  fs.writeFileSync(destPath, specjs);

  swig.log(swig.log.padLeft(destPath.grey + '\n', 2));

};
