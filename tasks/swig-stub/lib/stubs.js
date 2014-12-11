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
    gutil = require('gulp-util'),
    mustache = require('mustache');

  return through.obj(function stubsThrough (file, enc, cb) {

    if (file.isNull()) {
      cb(null, file);
      return;
    }

    if (file.isStream()) {
      cb(new gutil.PluginError('swig-stub:stubs', 'Streaming not supported'));
      return;
    }

    var extension = path.extname(file.path).toLowerCase(),
      contents;

    if (extension === '.mustache') {
      file.contents = new Buffer(mustache.render(file.contents.toString(), data));
      file.path = file.path.replace('.mustache', '');
    }

    cb(null, file);

  });
};