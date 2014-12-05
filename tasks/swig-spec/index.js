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

  gulp.task('spec', function (done) {

    var _ = require('underscore'),
      fs = require('fs'),
      path = require('path'),
      glob = require('glob'),
      sinonApiDoc = require('./lib/sinon-apidoc.js'),
      tap = require('gulp-tap'),

      defaultSpecLib = 'mocha',
      options = {},
      scripts = [],
      sinonPath = path.join(path.dirname(require.resolve('sinon')), '../pkg'),
      specFiles = [],
      specLib = swig.pkg.gilt ? swig.pkg.gilt.specsLibrary || defaultSpecLib : defaultSpecLib,
      specs = [],
      servers,
      specsPath = path.join(swig.target.path, 'public/spec/', swig.pkg.name),
      srcPath,
      impl;

    swig.log.task('Initializing Specs');

    try {
      swig.log.info('', 'Loading ' + specLib + '...');

      impl = require('./lib/' + specLib.toLowerCase());
    }
    catch (e) {
      if (e.code === 'MODULE_NOT_FOUND') {
        swig.log.error('spec', 'Spec Library: ' + specLib + ', hasn\'t been implemented.');
        swig.log(e);
      }
      else {
        throw e;
      }
    }

    if (swig.project.type === 'webapp') {
      srcPath = path.join(swig.target.path, 'public/js/', swig.pkg.name);
    }
    else {
      srcPath = path.join(swig.target.path, 'public/js/');
    }

    swig.log.info('', 'Enumerating Dependencies...');

    _.each(['browser_detect', 'json', 'modernizr', 'require', 'gilt_require'], function (module) {
      scripts.push(path.join(__dirname, 'node_modules/internal.' + module, 'js', module + '.js'));
    })

    swig.log.info('', 'Enumerating Specs...');

    // enum all of the files in the specs directory
    specFiles = glob.sync(path.join(specsPath, '/**/*.js'));

    // the file names should correspond with the name of the module used in gilt.define
    // this is used to `require` the test files and THEN launch mocha
    _.each(specFiles, function (file) {
      specs.push('\'' + path.basename(file, path.extname(file)) + '\'');
    });

    swig.log.info('', 'Enumerating APIDoc Sinon Servers...');

    gulp.src(path.join(swig.target.path, '/json/sinon/**/*.json'))
      .pipe(sinonApiDoc())
      .pipe(tap(function(file, t) {
        try {
          var fileServers = JSON.parse(file.contents);
          servers = _.filter(_.union(servers, fileServers), function(a) { return typeof a !== 'undefined'; });
        }
        catch (e) {
          console.log(e);
        }
      }))
      .on('end', function () {
        options = {
          baseUrl: srcPath,
          scripts: scripts,
          specs: specs.join(','),
          specsPath: specsPath,
          specFiles: specFiles,
          sinonPath: sinonPath,
          servers: servers
        };

        // fire our specs implementation (jasmine, mocha, etc..)
        impl(gulp, swig, options, done);
      });
  });

};
