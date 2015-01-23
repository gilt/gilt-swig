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
    res,
    fileCount = 0,
    errors = false;

  res = through.obj(function (file, enc, cb) {

    if (file.isNull()) {
      cb(null, file);
      return;
    }

    if (file.isStream()) {
      cb(new gutil.PluginError('swig-lint:handlebars-reporter', 'Streaming not supported'));
      return;
    }

    fileCount++;

    // listing all of the files that were successful is awefully verbose
    if (swig.argv.verbose || swig.argv.poolparty) {
      swig.log.success(null, file.path.replace('.js', '.handlebars'));
    }

    cb(null, file);
  },
  function flush (cb) {
    if (!errors) {
      if (fileCount){
        swig.log('   ' + fileCount + ' files lint-free\n');
      }
      else {
        swig.log('    No files to lint.\n');
      }
    }
    cb();
  });

  res.fail = function handlebarsFailure (e) {

    // Parse error on line 13:
    // ...></section>{{/if}}
    // ---------------------^
    // Expecting 'INVERSE', 'OPEN_ENDBLOCK', got 'EOF'

    errors = true;

    var message = e.message,
      file = e.fileName.underline,
      lines = message.split('\n'),
      error = lines[0],
      badCode = lines[1],
      position = lines[2],
      expected = lines[3] || 'Something went awry.',
      pad = swig.log.padding + swig.log.padding + ' ',
      matches = error.match(/(line (\d)+)\:/),
      lineNumber = matches[1] || 'line ???';

    swig.log();
    swig.log.error(null, file);

    swig.log(swig.log.padding + ' ' + expected.cyan);
    swig.log(pad + lineNumber.grey + ' ' + badCode.blue);
    swig.log(pad + (lineNumber + ' ').replace(/\w/g, ' ') + position);

    swig.log();
    swig.log.error('lint-handlebars', 'Please correct the error(s) shown before proceeding.');
  };

  return res;
};