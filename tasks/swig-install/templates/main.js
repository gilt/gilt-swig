{{preamble}}
(function initRequireCallback () {
  var oldRequireCallback = require.callback;
  require.callback = function requireCallback () {
    window.createConfig = function createConfig (key, value) {
      (define || createModule)(key.replace(/\./g, "/"), function () { return value; });
    };
    if (oldRequireCallback) { oldRequireCallback(); }
  };
}());
{{files}}
{{config}}