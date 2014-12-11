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

  // c) Given the list of all extracted package.json's and the file picked above:
  // i) Extract the uiDependencies or dependencies hash from each file
  // ii) Merge with that, the lazyDependencies hash from the same file
  // NOTE) we build up an intermediate data structure, for error reporting purposes.
  // d) Iterate over each set of dependencies, merging them together intelligently, and look for conflicts
  // i) Example of "intelligently" merging: given 2 versions of foo.bar, 1.2.3 and 1.2.x, merge that as 1.2.3, since 1.2.x is a mask that 1.2.3 satisfies.
  // e) Generate a merged package.json file in a temp folder

// handles merging module packages
module.exports = function (gulp, swig) {

  return function packageMerge () {
    var _ = require('underscore'),
      fs = require('fs'),
      path = require('path'),
      glob = require('glob'),
      gutil = require('gulp-util'),
      util = require('./merge-util')(gulp, swig),
      node = require('./merge-node')(gulp, swig, util),
      jvm = require('./merge-jvm')(gulp, swig, util),
      message,
      type;

    // figure out which type we're dealing with
    if (fs.existsSync(path.join(swig.cwd, 'app.js'))) { //node
      node();
    }
    else if (glob.sync(path.join(swig.cwd, '/lib/**/*.jar')).length) {
      jvm();
    }
    else if (swig.argv.module) {
      swig.log.task('Merging UI-* Module Package Dependencies');

      var pkg = swig.pkg.dependencies;

      // if a task is requesting install and needs devDependencies to be available
      // it can use the --devDependencies flag or set it manually on swig.argv.
      if (swig.argv.devDependencies) {
        pkg = _.extend(pkg, swig.pkg.devDependencies || {});
      }

      util.generate(pkg);
    }
    else {
      throw new gutil.PluginError('package-merge',
      "Couldn't determine what type of thing we\'re working on.\n\
      If it's a Node app, it should have an 'app.js' file in the root.\n\
      If it's a Play/Scala app, it should have JARs in /lib.\n\
      Swig only supports Node and JVM apps, and ui-* module repos.");
    }
  };
};