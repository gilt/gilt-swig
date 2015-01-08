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

  // TODO:
  // module name
  // js and less dependencies
  // merge conflict markers /^[<>=]{7}/ + file names snake_case, no hypens
  // console.log /console\.(log|debug|info|warn|error)\(/

  // /
  //   createModule
  //   \s*\(\s*      # begin method params
  //   (?:
  //     \{\s*
  //       (?:global\s*:\s*["'][\w\$]+["']\s*,\s*)?
  //       amd\s*:\s*
  //         ("|')         # open quote around module name
  //           ([\w\.\/]+) # module name
  //         \1            # close quote
  //       (?:\s*,\s*global\s*:\s*["'][\w\$]+["'])?
  //     \s*\}
  //   |
  //     ("|')         # open quote around module name
  //       ([\w\.\/]+) # module name
  //     \3            # close quote
  //   )
  //   \s*,\s*
  // /x

module.exports = function (gulp, swig) {

  if (!swig.pkg) {
    return;
  }

  var _ = require('underscore'),
    path = require('path'),

    jshint = require('gulp-jshint'),
    recess = require('gulp-recess'),
    handlebars = require('gulp-handlebars'),
    addsrc = require('gulp-add-src'),
    buffer = require('gulp-buffer'),
    gutil = require('gulp-util'),

    mock = require('./lib/mock')(gulp, swig),
    recessReporter = require('./lib/recess-reporter')(swig),
    jsFailReporter = require('./lib/jshint-fail-reporter')(gulp, swig),
    handlebarsReporter = require('./lib/handlebars-reporter')(swig),

    baseName,
    baseSource,
    paths;

  function source(type, extension) {
    return baseSource
            .replace(/\{type\}/g, type)
            .replace(/\{extension\}/g, extension);
  }

  // setup our glob paths
  if (swig.project.type === 'webapp') {
    baseName = path.basename(swig.target.path);
    baseSource = path.join(swig.target.path, 'public/{type}/', baseName, '/src/**/*.{extension}');
  }
  else {
    baseSource = path.join(swig.target.path, '/**/*.{extension}');
  }

  paths = {
    js: source('js', 'js'),
    css: source('css', '{css,less}'),
    templates: source('templates', 'handlebars')
  };

  // we never want to lint reset.less|css files since they'll almost always have linting errors
  if (swig.project.type === 'webapp') {
    paths.css = [
      paths.css,
      '!' + path.join(swig.target.path, 'public/css/', baseName, '/src/**/reset.{css,less}')
    ];
  }

  // load some of our misc linting tasks
  require('./lib/package-version')(gulp, swig, paths);
  require('./lib/unicode')(gulp, swig, paths);

  // load the major linting tasks
  gulp.task('lint-script', function () {
    var jshintrc = path.join(__dirname, '.jshintrc');

    swig.log.task('Linting Javascript');

    return gulp.src(paths.js)
      .pipe(jshint(jshintrc))
      .pipe(jshint.reporter('jshint-stylish'))
      .pipe(jsFailReporter());
  });

  gulp.task('lint-css', function () {

    swig.log.task('Linting CSS and LESS');

    var recessOpts = {
        strictPropertyOrder: false,
        noOverqualifying: false
      };

    return gulp.src(paths.css)
      .pipe(buffer())
      .pipe(mock())
      .pipe(recess(recessOpts))
      .on('error', recessReporter.fail)
      .pipe(recessReporter);
  });

  gulp.task('lint-handlebars', function (cb) {
    swig.log.task('Linting Handlebars Templates');

    return gulp.src(paths.templates)
      .pipe(handlebars())
      .on('error', handlebarsReporter.fail)
      .pipe(handlebarsReporter);
  });

  gulp.task('lint', function (cb) {
    swig.seq(
      'lint-script',
      'lint-package-version',
      'lint-unicode',
      'lint-css',
      'lint-handlebars',
    cb);
  });
};
