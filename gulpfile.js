
var gulp = require('gulp'),
  path = require('path');

require('colors');

gulp.task('dependencies', function() {
  var david = require('gulp-david');

  return gulp.src(path.join(__dirname,'package.json'))
    .pipe(david());
});

gulp.task('javascript', ['dependencies'], function () {
  var jshint = require('gulp-jshint'),
    jshintrc = path.join(__dirname, '.jshintrc'),
    failReporter = require('./test/lib/jshint-fail-reporter')(gulp);

  return gulp.src([
      path.join(__dirname, '/index.js'),
      path.join(__dirname, 'lib/**/*.js'),
      '!' + path.join(__dirname, '/**/node_modules/**/*')
    ])
    .pipe(jshint(jshintrc))
    .pipe(failReporter())
    .pipe(jshint.reporter('jshint-stylish'))
});

gulp.task('default', ['javascript'], function (done) {
  done();
});
