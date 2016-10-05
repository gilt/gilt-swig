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
var gulp = require('gulp'),
  swig = require('@gilt-tech/swig')(gulp);

// only require dev dependencies when in development mode,
// or when the environment hasn't been defined.
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  if (swig.pkg.devDependencies) {
    try {
      Object.keys(swig.pkg.devDependencies).forEach(function(module) {
        if (/@gilt-tech\/swig-/.test(module)) {
          require(module)(gulp, swig);
          console.log('Loaded: ' + module);
        }
      });
    } catch (e) {
      swig.log.error('gulpfile.js tried to require some dev dependencies that failed. Are they installed?');
      swig.log('     - ' + e.message);
      process.exit(1);
    }
  }
}
