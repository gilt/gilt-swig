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
    success = true,
    filecount = 0,
    problems = 0,
    maxProblems = 10,
    res;

  res = through.obj(function (file, enc, cb) {

    if (file.isNull()) {
      cb(null, file);
      return;
    }

    if (file.isStream()) {
      cb(new gutil.PluginError('swig-lint:reporter', 'Streaming not supported'));
      return;
    }

    filecount++;

    var recess = file.recess,
      liner = /^([0-9]+)(\.\s)(.+)$/i,
      lines,
      matches,
      lineNumber,
      target,
      desc;

    if (recess && !recess.success) {

      swig.log('');
      swig.log.warn(null, file.path.underline);

      success = false;

      lines = _.reject(recess.results, function (line) { return !line.trim(); });

      _.each(lines, function (line) {
        line = gutil.colors.stripColor(line).trim();

        if (!desc) {
          desc = line;
        }
        else {
          matches = liner.exec(line);
          lineNumber = parseInt(matches[1]);
          target = matches[3];

          swig.log(swig.log.padding + desc.cyan);
          swig.log(swig.log.padding + swig.log.padding + ('line ' + lineNumber).grey + ' ' + target.blue);
          desc = null;
          problems++;
        }
      });

      swig.log();

    }
    else {
      swig.log.success(null, file.path);
    }

    cb(null, file);

  }, function (cb) {
    if (filecount === 0 || success) {
      swig.log.write('  ');
      swig.log.success(null, '  ' + filecount + ' file(s), success.\n');
    }
    else if (filecount > maxProblems || problems > maxProblems) {
      swig.log.error('lint-less', 'You\'ve got ' + problems.toString().magenta + ' warnings. Please do some cleanup before proceeding.');
      process.exit(0);
    }
    else {
      swig.log('');
    }

    cb();
  });

  res.fail = function recessFailure (e) {

    var recess = e.recess;

    swig.log();
    swig.log.error(null, e.fileName);

    swig.log(swig.log.padding + swig.log.padding + (' line ' + recess.line + ' col ' + recess.col).grey + ' ' + recess.message.blue);

    swig.log();
    swig.log.error('lint-css', 'Please correct the error(s) shown before proceeding.');
    process.exit(0);
  };

  return res;
};