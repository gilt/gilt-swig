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

  var _ = require('underscore'),
    co = require('co'),
    exec = require('co-exec'),
    path = require('path'),
    globby = require('globby'),
    fs = require('fs'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    replace = require('gulp-replace'),
    mincss = require('gulp-minify-css'),
    tap = require('gulp-tap'),
    rimraf = require('rimraf'),
    handlebars = require('gulp-handlebars'),
    basePath = path.join(swig.target.path, '/public/');

  function renameFile (path) {
    path.basename = path.basename.replace('.src', '') + '.min';
    return path;
  }

  gulp.task('minify-js', function () {

    var glob = path.join(basePath, '/js/', swig.target.name, '/*.src.js');

    swig.log('');
    swig.log.task('Minifying Javascript using Uglify');

    return gulp.src(glob)
      .pipe(tap(function (file) {
        swig.log.info('', 'Minifying: ' + path.basename(file.path).grey);
      }))
      .pipe(uglify())
      .pipe(rename(renameFile))
      .pipe(gulp.dest(path.dirname(glob)))
  });

  gulp.task('minify-css', ['minify-js'], function () {

    var glob = path.join(basePath, '/css/', swig.target.name, '/*.src.css'),
      blackMagic = new RegExp('url\\((\\/a)?(\\/img\\/)(' + swig.target.name + ')(\\/[^\\)]+)\\)', 'ig'),

      // turns this:
      //  /img/web-mosaic/nav/footer/footer-sprite.png
      // into this:
      //  //assets[n].giltcdn.com/img/web-mosaic/1.0.0/nav/footer/footer-sprite.png
      replaceFn = function (match, leading, imgDir, target, asset) {
        var min = 5,
          max = 8,
          assetServer = Math.floor(Math.random() * (max - min + 1)) + min,
          result;

        result = 'url(//a' + assetServer + '.giltcdn.com/a' + imgDir + target + '/' + swig.pkg.version + asset + ')';

        return result;
      };

    swig.log('');
    swig.log.task('Minifying CSS using CleanCSS');

    return gulp.src(glob)
      .pipe(tap(function (file) {
        swig.log.info('', 'Minifying: ' + path.basename(file.path).grey);
      }))
      .pipe(mincss())
      .pipe(replace(blackMagic, replaceFn))
      .pipe(rename(renameFile))
      .pipe(gulp.dest(path.dirname(glob)))
  });

  gulp.task('minify-templates', ['minify-css'], function () {

  /*
    NOTE: ui-build used handlebars@1.0.12
          The precompile output from 1.0.0 to 2.0.0 changed significantly
          and was not backwards compatible.
          Handlebars is now at version 3.0.0.
          We're using 1.0.12 and telling gulp-handlebars to use the same
          version so that the output matches ui-build.
          This should be updated at some point in the future.
  */

    var templatesPath = path.join(basePath, '/templates/', swig.target.name),
      glob = path.join(templatesPath, '/**/*.handlebars');

    swig.log('');
    swig.log.task('Precompiling Handlebars Templates');

    return gulp.src(glob)
      .pipe(tap(function (file) {
        swig.log.info('', 'Precompiling: ' + file.path.replace(templatesPath + '/', '').grey);
      }))
      .pipe(handlebars({
        handlebars: require('handlebars'),
        compilerOptions: {
          simple: true,
          root: 'public/templates/' + swig.target.name
        }
      }))
      .pipe(rename(function (path) {
        path.basename = path.basename.replace(templatesPath, '');
        return path;
      }))
      .pipe(gulp.dest(path.join(basePath, '/js/', swig.target.name, '/templates')))
  });

  gulp.task('minify', ['minify-templates'], function (done) {
    done();

    // minify-js
    // minify-css
    // minify-templates
    // done
  });

};
