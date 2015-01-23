
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

  var maxWarnings = 10;

  return function reporter () {

    var through = require('through2'),
      gutil = require('gulp-util'),
      fileCount = 0,
      errorCount = 0,
      hasErrors = false;

    return through.obj(function (file, enc, cb) {
      if (file.isNull()) {
        cb(null, file);
        return;
      }

      if (file.isStream()) {
        cb(new gutil.PluginError('swig-lint:reporter', 'Streaming not supported'));
        return;
      }

      if (file.jshint && !file.jshint.ignored) {
        fileCount++;
      }

      if (file.jshint && !file.jshint.success && !file.jshint.ignored) {
        var results = file.jshint.results;

        errorCount += results.length;

        if (!hasErrors) {
          results.forEach(function (e) {
             // E: Error, W: Warning, I: Info
            if (e.error.code && e.error.code[0] === 'E') {
              hasErrors = true;
            }
          });
        }
      }

      cb(null, file);
    },
    function flush (cb) {
      if (hasErrors) {
        swig.log.error('lint-script', 'Please correct errors in ' + 'red'.red + ' before proceeding.');
        process.exit(0);
      }
      else if (errorCount > maxWarnings) {
        swig.log.error('lint-script', 'You\'ve got ' + errorCount.toString().magenta + ' warnings.\nPlease do some cleanup before proceeding.');
        process.exit(0);
      }
      else {
        if (fileCount){
          swig.log('   ' + fileCount + ' files lint-free\n');
        }
        else {
          swig.log('    No files to lint.\n');
        }
        cb();
      }

    });
  };
};
