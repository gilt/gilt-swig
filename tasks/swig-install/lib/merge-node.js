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

// handles merging module packages for node apps
module.exports = function (gulp, swig, util) {

  return function node () {
    var _ = require('underscore'),
      path = require('path'),
      uiDeps,
      pkg;

    swig.log.task('Merging Node App Package(s)');
    swig.log.info('merge-node', 'Extracting dependencies');

    pkg = _.extend({}, swig.pkg);

    // we don't want dependencies mixed with uiDeps in node apps
    if (swig.project.type !== 'module' && pkg.dependencies) {
      delete pkg.dependencies;
    }

    uiDeps = util.extract(pkg, {}, path.basename(swig.cwd));

    swig.log.success(null, 'Done\n');

    uiDeps = util.iterate(uiDeps);

    if (uiDeps) {
      util.generate(uiDeps);
    }
    else {
      swig.log.error('merge-node', 'Node validation of dependencies failed.');
      process.exit(0);
    }
  };
};