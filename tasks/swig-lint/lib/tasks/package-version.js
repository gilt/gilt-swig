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

  var through = require('through2');

  function plugin () {

    var regex = /\$\$PACKAGE_VERSION\$\$/,
      success = true,
      fileCount = 0,
      content;

    return through.obj(function (file, enc, cb) {

      if (file.isBuffer()) {
        content = file.contents.toString();
        if (content.indexOf('createModule') > -1) {

          fileCount++;

          if (!regex.test(content)) {
            success = false;
            swig.log.warn(null, file.path);
          }
          else {
            // listing all of the files that were successful is awefully verbose
            if (swig.argv.verbose || swig.argv.poolparty) {
              swig.log.success(null, file.path);
            }
          }
        }
      }

      cb();
    }, function (cb) {
      if (!success) {
        swig.log();
        swig.log.warn('Please make sure you\'re retuning an object containing ' + '"version: \'$$PACKAGE_VERSION$$\'"'.bold);
      }
      else {
        if (fileCount){
          swig.log('   ' + fileCount + ' files lint-free\n');
        }
        else {
          swig.log('    No files to lint.\n');
        }
      }
      cb();
    });
  }

  gulp.task('lint-package-version', ['lint-setup'], function () {

    swig.log.task('Linting Package Version');

    return gulp.src(swig.linter.paths.js)
      .pipe(plugin());
  });

};
