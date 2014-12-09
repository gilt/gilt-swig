// this file is included within each <framework>-runner.html file
(function (window) {

  var specNames = [],
    specFiles = [],
    sinonEndpoints = [];

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

  gilt.endpoints = {
    // the default server, created when specs start
    _server: null,

    add: function (endpoint) {
      sinonEndpoints.push(endpoint);
    },

    init: function initEndpoint (server, endpoints) {
      if (typeof server === 'undefined') {
        server = sinon.fakeServer.create();
      }

      if (endpoints) {
        for(var i = 0; i < endpoints.length; i++) {
          var srvr = endpoints[i];
          server.respondWith(srvr.method, new RegExp(srvr.path), [
            srvr.code,
            { 'Content-Type': 'application/json' },
            srvr.data
          ]);
        }
      }

      return server;
    }
  };

  gilt.specs = {
    addFile: function (file) {
      specFiles.push(file);
    },

    start: function (options) {

      gilt.endpoints._server = gilt.endpoints.init(undefined, sinonEndpoints);

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