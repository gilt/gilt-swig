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
    through = require('through2');

  function plugin () {

    var regex = /[^\u0000-\u00ff]/,
      success = true,
      fileSuccess = true,
      fileCount = 0,
      content,
      matches;

    return through.obj(function (file, enc, cb) {

      if (file.isBuffer()) {
        content = file.contents.toString();
        content = content.split('\n');

        fileCount++;

        _.each(content, function (line, index) {
          fileSuccess = !regex.test(line);

          if (!fileSuccess) {
            success = false;
            matches = line.match(regex);

            swig.log.warn(null, file.path);
            swig.log(swig.log.padding + swig.log.padding +
              ('line ' + (index + 1).toString() + ' col ' + (line.indexOf(matches[0]) + 1)).grey +
              ' Found possible unicode character.'.blue
            );
            swig.log();
          }
        });

        if (fileSuccess) {
          // listing all of the files that were successful is awefully verbose
          if (swig.argv.verbose || swig.argv.poolparty) {
            swig.log.success(null, file.path);
          }
        }
      }

      cb();
    }, function (cb) {
      if (!success) {
        swig.log();
        swig.log.warn('Please clean up any unicode characters, they can cause problems.');
      }
      else {
        swig.log('   ' + fileCount + ' files lint-free\n');
      }

      cb();
    });
  }

  gulp.task('lint-unicode', ['lint-setup'], function () {

    swig.log.task('Linting Unicode Characters');

    return gulp.src(swig.linter.paths.js)
      .pipe(plugin());
  });

};
