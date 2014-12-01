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

module.exports = function (gulp, swig) {

  if (!swig.pkg) {
    return;
  }

  gulp.task('spec', function () {
    var defaultSpecLib = 'mocha',
      specLib = swig.pkg.gilt ? swig.pkg.gilt.specsLibrary || defaultSpecLib : defaultSpecLib;

    swig.log.task('Initializing Specs');

    try {
      var impl = require('./lib/' + specLib.toLowerCase());

      return impl(gulp, swig);
    }
    catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
        swig.log.error('spec', 'Spec Library: ' + specLib + ', hasn\'t been implemented.');
      }
      else {
        throw e;
      }
    }
  });

};