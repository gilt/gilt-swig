module.exports = function () {

  'use strict';
  var _ = require('underscore'),
    path = require('path'),
    gutil = require('gulp-util'),
    through = require('through2'),
    pluginName = 'mock-apidoc';

  function padLeft (num) {
    return num < 10 ? '0' + num : '' + num;
  }

  function pathToRegex (path) {
    var parts = path.split('/'),
      result = _.map(parts, function(part) {
        return /^:.+$/.test(part) ? '[^\/]+' : part;
      })
      .join('/');

    return result;
  }

  function generate (type) {
    var result = null;

    switch(type.toLowerCase()) {
      case 'string':
        result = '';
        for (var i=0; i < 16; i++) {
          result += String.fromCharCode(Math.round(Math.random() * 26) + 65);
        }
        break;
      case 'boolean':
        result = !!Math.round(Math.random());
        break;
      case 'date-iso8601':
        var oneYear = 1000 * 60 * 60 * 24 * 365,
          date = new Date(new Date().valueOf() + Math.round(Math.random() * oneYear));

        result = date.getUTCFullYear() + '-' + padLeft(date.getUTCMonth() + 1) + '-' + date.getUTCDate();
        break;
      case 'date-time-iso8601':
        var oneDay = 1000 * 60 * 60 * 24,
          time = new Date(new Date() + Math.round(Math.random() * oneDay));

        result = generate('date-iso8601') + 'T' + padLeft(time.getUTCHours()) + ':' + padLeft(time.getUTCMinutes()) + ':' + padLeft(time.getUTCSeconds()) + 'Z';
        break;
      case 'decimal':
        result = Math.round(Math.random() * 256 * 100) / 100;
        break;
      case 'integer':
      case 'long':
        result = Math.ceil(Math.random() * 256);
        break;
      case 'object':
        result = {};
        break;
      case 'uuid':
        result = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});
        break;
    }

    return result;
  }

  return through.obj(function (file, enc, cb) {
    if (file.isNull()) {
      cb(null, file);
      return;
    }

    if (file.isStream()) {
      cb(new gutil.PluginError(pluginName, 'Streaming not supported'));
      return;
    }

    var apidoc,
      fixtures = {},
      results = [];

    try {
      apidoc = JSON.parse(file.contents.toString('utf8'));
    }
    catch (e) {
      cb(new gutil.PluginError(pluginName, 'Failed parsing apidoc JSON: ' + file.relative));
    }

    _.each(apidoc.models, function (model, name) {
      var properties = {};

      _.each(model.fields, function (field) {
        properties[field.name] = generate(field.type);
      });

      fixtures[name] = properties;
    });

    _.each(apidoc.models, function (model, name) {
      _.each(model.fields, function (field) {
        if (!_.isUndefined(fixtures[field.type])) {
          fixtures[name][field.name] = fixtures[field.type];
        }
      });
    });

    _.each(apidoc.resources, function (res, name) {
      var resourcePath = res.path || '',
        response;

      _.each(res.operations, function (op) {

        var operationPath = resourcePath + (op.path || ''),
          keys = _.keys(op.responses),
          tempResponses,
          responseCode;

        responseCode = _.first(keys.filter(function(code) { /^2\d{2}/.test(code); })) || _.first(keys);
        response = fixtures[op.responses[responseCode].type];

        if (/^\[.+\]$/.test(op.responses[responseCode].type)) {
          tempResponses = [];
          for (var i = 0; i < (Math.random() + 10); i++) {
            tempResponses.push(response);
          }
          response = tempResponses;
        }

        results.push({
          method: op.method,
          path: pathToRegex(operationPath),
          responseCode: responseCode,
          // we have to do this because mustache will be expecting a string,
          // otherwise it'll render as [object Object]
          responseData: JSON.stringify(response)
        });
      });
    });

    file.contents = new Buffer(JSON.stringify(results), 'utf8');

    cb(null, file);
  },
  function (cb) {
    cb();
  });
};
