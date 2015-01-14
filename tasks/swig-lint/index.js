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

  var path = require('path'),
    paths;

  gulp.task('lint-setup', function (done) {

    var baseName,
      baseSource;

    function source (type, extension) {
      return baseSource
              .replace(/\{type\}/g, type)
              .replace(/\{extension\}/g, extension);
    }

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

    // some hacky shit so that package-version and unicode tasks can be loaded
    // normally from another file, but still have access to this.
    // minor minor namespace pollution for simplicity. please don't follow this pattern.
    swig.linter = { paths: paths };

    done();

  });

  // load some of our misc linting tasks
  require('./lib/tasks/package-version')(gulp, swig);
  require('./lib/tasks/unicode')(gulp, swig);

  gulp.task('lint-script', ['lint-setup'], function () {

    var jshint = require('gulp-jshint'),
      jshintrc = path.join(__dirname, '.jshintrc'),
      failReporter = require('./lib/reporters/jshint-fail-reporter')(gulp, swig);

    swig.log.task('Linting Javascript', { noNewline: true });

    return gulp.src(paths.js)
      .pipe(jshint(jshintrc))
      .pipe(failReporter())
      .pipe(jshint.reporter('jshint-stylish'))
  });

  gulp.task('lint-css', ['lint-setup'], function () {

    swig.log.task('Linting CSS and LESS');

    var buffer = require('gulp-buffer'),
      mock = require('./lib/mock')(gulp, swig),
      recess = require('gulp-recess-plus'),
      reporter = require('./lib/reporters/recess-reporter')(swig),
      recessOpts = {
        strictPropertyOrder: false,
        noOverqualifying: false
      };

    return gulp.src(paths.css)
      .pipe(buffer())
      .pipe(mock())
      .pipe(recess(recessOpts))
      .on('error', reporter.fail)
      .pipe(reporter);
  });

  gulp.task('lint-handlebars', ['lint-setup'], function () {
    swig.log.task('Linting Handlebars Templates');

    var handlebars = require('gulp-handlebars'),
      reporter = require('./lib/reporters/handlebars-reporter')(swig);

    return gulp.src(paths.templates)
      .pipe(handlebars())
      .on('error', reporter.fail)
      .pipe(reporter);
  });

  gulp.task('lint', function (done) {
    swig.seq(
      'lint-script',
      'lint-package-version',
      'lint-unicode',
      'lint-css',
      'lint-handlebars',
      done
    );
  });
};
