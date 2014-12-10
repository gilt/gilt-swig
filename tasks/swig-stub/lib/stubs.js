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

module.exports = function stubsPlugin (swig, data) {

  var _ = require('underscore'),
    path = require('path'),
    through = require('through2'),
    gutil = require('gulp-util');

  return through.obj(function stubsThrough (file, enc, cb) {

    if (file.isNull()) {
      cb(null, file);
      return;
    }

    if (file.isStream()) {
      cb(new gutil.PluginError('swig-stub:stubs', 'Streaming not supported'));
      return;
    }

    // TODO
    // files with .mustache extension should be rendered using `data`,
    // the file should be renamed in the stream
    // and the content should be updated

    cb(null, file);

  });
};