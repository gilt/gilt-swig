{{preamble}}
// The createConfig definition has been moved to internal.gilt_require.
// hook the existing require callback, if one has already been setup inline,
// to ensure that inline config pairs are defined first.
var _cb = require.callback;

require.callback = function () {
  _cb && _cb();
  var configs = {{configs}};
  for (var key in configs) {
    if (Object.prototype.hasOwnProperty.call(configs, key)) {
      gilt.define(key, configs[key]);
    }
  }
};
{{files}}
