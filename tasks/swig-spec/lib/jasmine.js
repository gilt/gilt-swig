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

module.exports = function (gulp, swig, options, done) {

  var _ = require('underscore'),
    file = require('gulp-file'),
    fs = require('fs'),
    path = require('path'),
    jasmine = require('./gulp-jasmine-phantomjs/gulp-jasmine-phantomjs.js'),
    mustache = require('mustache'),

    jasminePath = path.join(__dirname, 'gulp-jasmine-phantomjs/lib/jasmine'),

    reporterPath = path.dirname(require.resolve('jasmine-reporters')),

    runnerPath = path.join(__dirname, '../templates/jasmine-runner.html'),
    runner = fs.readFileSync(runnerPath, 'utf-8');

    swig.log.info('', 'Rendering Runner...\n');

    options = _.extend(options, {
      jasminePath: jasminePath,
      reporterPath: reporterPath
    });

    runner = mustache.render(runner, options);

    swig.log.task('Running PhantomJS+Jasmine');
    swig.log('');

    file('runner.html', runner, { src: true })
      .pipe(gulp.dest(options.specsPath))
      .pipe(jasmine({
        phantomjs: { webSecurityEnabled: false }
      }))
      .on('end', done);
};
