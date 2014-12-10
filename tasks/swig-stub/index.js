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
    path = require('path'),
    fs = require('fs'),
    co = require('co'),
    gutil = require('gulp-util'),
    prettyjson = require('prettyjson');;

  gulp.task('stub', co(function * () {

    var response,
      thingType,
      types = ['node'],
      data = {
        name: 'Unknown',
        description: 'Unknown',
        port: 0,
        alias: '',
        navigation: true,
        footer: true
      },
      prompts = {
        type: 'Please enter the type of thing you\'d like to stub:',
        name: 'Please enter the name of the thing:',
        description: 'Please enter the description of the thing:',
        port: 'Please enter the port this thing should run on:',
        alias: 'If you\'d like this to have a directory alias (eg. /thing), please enter it:',
        navigation: 'Should this render the navigation/header?',
        footer: 'Should this render the footer?',
        continue: 'Does everything look OK?'
      };

    swig.log('You can stub the following types of things: ' + types.join(', ').white);

    swig.log();
    thingType = yield swig.log.prompt(swig.log.padLeft(prompts.type.white, 1));

    if (!thingType || _.indexOf(types, thingType) === -1) {
      throw new gutil.PluginError('swig-stub', 'Hey pal, you have to choose a valid type.');
    }

    swig.log();
    data.name = yield swig.log.prompt(swig.log.padLeft(prompts.name.white, 1));

    if (!data.name) {
      throw new gutil.PluginError('swig-stub', 'Hey pal, you have to choose a name.');
    }

    swig.log();
    data.description = yield swig.log.prompt(swig.log.padLeft(prompts.description.white, 1));

    if (!data.description) {
      throw new gutil.PluginError('swig-stub', 'Hey pal, you have to choose a name.');
    }

    swig.log();
    data.port = yield swig.log.prompt(swig.log.padLeft(prompts.port.white, 1)) || 0;

    if (!data.port) {
      throw new gutil.PluginError('swig-stub', 'Hey pal, you have to choose a valid port > 0.');
    }

    swig.log();
    data.alias = yield swig.log.prompt(swig.log.padLeft(prompts.alias.white, 1)) || '';

    swig.log();
    data.navigation = yield swig.log.confirm(swig.log.padLeft(prompts.navigation.white, 1));

    swig.log();
    data.footer = yield swig.log.confirm(swig.log.padLeft(prompts.footer.white, 1));

    swig.log();
    swig.log('Here\'s the data we\'ve collected:');
    swig.log(prettyjson.render(_.extend(data, { type: thingType })));

    swig.log();
    response = yield swig.log.confirm(swig.log.padLeft(prompts.continue, 1));

    if (response) {
      swig.log('THUMBS UP BRO')
    }

  }));
};
