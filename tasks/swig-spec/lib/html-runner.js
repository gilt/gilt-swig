// this file is included within each <framework>-runner.html file
(function (window) {

  var specNames = [],
    specFiles = [],
    mockEndpoints = [];

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

  window.targetExperience = 'full';

  window.requireModules = function () {
    throw new Error('requireModules is now obsolete.\n\
      If the file begins with requireModules, please update it to use `gilt.define`.\n\
      If requireModules is used within a `describe`, please update it to use `gilt.require`.');
  };

  // internal.gilt_require has deprecated `requireSpecs`
  window.requireSpecs = function requireSpecs () {
    var args = Array.prototype.slice.call(arguments),
      moduleName = (new Date()).getTime().toString();

    // create a temp name for the module, prepend it to arguments.
    args.unshift(moduleName);

    // keep this name in a list, because we're going to require on it
    // to start the specs
    specNames.push(moduleName);

    gilt.define.apply(this, args);
  };

  gilt = window.gilt || (window.gilt = {});

  gilt.specs = {
    addFile: function (file) {
      specFiles.push(file);
    },

    start: function (options) {

      // define any configs within package.json : configDependencies
      if (options.config) {
        for (var key in options.config) {
          if (Object.prototype.hasOwnProperty.call(options.config, key)) {
            gilt.define(key, function () { return options.config[key] });
          }
        }
      }

      if (options.targetExperience) {
        window.targetExperience = options.targetExperience;
      }

      requirejs.config({
        baseUrl: options.baseUrl,
        deps: specFiles,
        callback: function () {
          require(specNames, options.callback);
        }
      });

    }

  };

})(window);