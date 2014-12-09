// this is a port of gulp-mocha-phantomjs
'use strict';

var fs = require('fs'),
  path = require('path'),
  url = require('url'),
  spawn = require('child_process').spawn,
  through = require('through2'),
  gutil = require('gulp-util'),
  pluginName = 'gulp-jasmine-phantomjs';

function isObject (obj) {
  var type = typeof obj;
  return type === 'function' || type === 'object' && !!obj;
};

function extend (obj) {
  if (!isObject(obj)) return obj;
  var source, prop;
  for (var i = 1, length = arguments.length; i < length; i++) {
    source = arguments[i];
    for (prop in source) {
      obj[prop] = source[prop];
    }
  }
  return obj;
};

function jasminePhantomJS (options) {
  options = options || {};

  var scriptPath = path.join(__dirname, '/lib/jasmine-phantomjs.js');

  if (!scriptPath) {
    throw new gutil.PluginError(pluginName, 'jasmine-phantomjs.js not found');
  }

  return through.obj(function (file, enc, cb) {
    var args = [
      scriptPath,
      file.path,
      JSON.stringify(options.phantomjs || {})
    ];

    spawnPhantomJS(args, options, function (err) {
      if (err) {
        this.emit('error', err);
      }

      this.push(file);

      cb();
    }.bind(this));
  });
}

function mergeQuery(path, query) {
  var parsed = url.parse(crossPlatform(path), true);

  parsed.query = extend(parsed.query, query);
  parsed.search = null;

  return url.format(parsed);
}

function crossPlatform(str) {
  return str.split(require('path').sep).join('/');
}

function spawnPhantomJS(args, options, cb) {

  //lookup('.bin/phantomjs', true) || lookup('phantomjs/bin/phantomjs', true),
  var phantomjsPath = path.join(path.dirname(require.resolve('phantomjs')), '../bin/phantomjs'),
    errors = [],
    phantomjs;

  if (!phantomjsPath) {
    return cb(new gutil.PluginError(pluginName, 'PhantomJS not found'));
  }

  phantomjs = spawn(phantomjsPath, args);

  phantomjs.stdout.pipe(process.stdout);
  // phantomjs.stderr.pipe(process.stderr);
  phantomjs.stderr.on('data', function (data) {
    errors.push(data);
  });

  phantomjs.on('error', function (err) {
    cb(new gutil.PluginError(pluginName, err.message));
  });

  phantomjs.on('exit', function (code) {
    if (errors.length) {
      for(var i = 0; i < errors.length; i++){
        console.log('[phantom] ' + errors[i]);
      }
    }

    if (code === 0 || options.silent) {
      cb();
    } else {
      cb(new gutil.PluginError(pluginName, 'Tests Failed: PhantomJS exited with code: ' + code));
    }
  });
}

module.exports = jasminePhantomJS