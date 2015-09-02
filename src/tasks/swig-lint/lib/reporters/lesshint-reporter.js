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

module.exports = function (swig) {

  var _ = require('underscore'),
    through = require('through2'),
    gutil = require('gulp-util'),
    stylish = require('jshint-stylish'),
    success = true,
    fatal = false,
    fileCount = 0,
    problems = 0,
    errors = 0,
    maxProblems = 10,
    res;

  function toJshint (file) {
    return file.lesshint.errors.map(function (error) {
      problems++;

      if (error.severity === 'error') {
        fatal = true;
        errors++;
      }

      return {
        file: file.base + error.file,
        error: {
          character: error.column,
          code: error.severity.substring(0, 1).toUpperCase() + ' ' + error.linter,
          line: error.line - (file.mockLength ? file.mockLength : 0),
          reason: error.message
        }
      }
    });
  }

  res = through.obj(function (file, enc, cb) {

    if (file.isNull()) {
      cb(null, file);
      return;
    }

    if (file.isStream()) {
      cb(new gutil.PluginError('swig-lint:lesshint-reporter', 'Streaming not supported'));
      return;
    }

    fileCount++;

    if (file.lesshint && !file.lesshint.success) {

      stylish.reporter(toJshint(file));

      success = false;
    }
    else {
      // listing all of the files that were successful is awefully verbose
      if (swig.argv.verbose || swig.argv.poolparty) {
        swig.log.success(null, file.path);
      }
    }

    cb(null, file);

  }, function (cb) {
    var output;

    if (fileCount === 0 || success) {
      if (fileCount){
        swig.log('   ' + fileCount + ' files lint-free\n');
      }
      else {
        swig.log('    No files to lint.\n');
      }
    }
    else if (fileCount > maxProblems || problems > maxProblems) {
      output = 'You\'ve got ' + problems.toString().magenta + (problems > 1 ? ' warnings' : ' warning');

      if (errors > 0) {
        output += ' and ' + errors.toString().magenta + (errors > 1 ? ' errors' : ' error');
      }

      swig.log.error('lint-css', output + '. Please do some cleanup before proceeding.');
      
    }
    else if (fatal) {
      output = 'You\'ve got ' + errors.toString().magenta + (errors > 1 ? ' errors' : ' error');

      swig.log();
      swig.log.error('lint-css', output + '. Please do some cleanup before proceeding.');
      process.exit(0);
    }
    else {
      swig.log('');
    }

    cb();
  });

  return res;
};