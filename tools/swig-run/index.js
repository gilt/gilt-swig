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

  var path = require('path'),
    spawn = require('child_process').spawn,
    fs = require('fs'),
    _ = require('underscore'),

    node = {
      command: path.join(__dirname, '/lib/command-node'),
      args: [],
      env: {},
      valid: function () {
        var pkg = swig.pkg,
          errors = [];

        if (!pkg) {
          errors.push('  package.json not found!');
        }
        else {
          if (!pkg.name) {
            errors.push('  package.json Name missing!');
          }

          if (!pkg.version) {
            errors.push('  package.json Version missing!');
          }

          if (!pkg.description) {
            errors.push('  package.json Description missing!');
          }
        }

        return errors;
      },
      exists: function () {
        swig.log.task('Looking for app.js');
        return fs.existsSync(path.join(process.cwd(), 'app.js'));
      }
    };

  function run (cb) {

    var env = _.extend(process.env, node.env || {}),
      cp = spawn(node.command, node.args, env);

    cp.stdout.pipe(process.stdout);
    cp.stderr.pipe(process.stderr);

    cp.on('error', function (err) {
      swig.log.error('swig-app', 'Error:');
      swig.log(err);
    });

    cp.on('exit', function (code) {
      cb();
    });

    // handles CTL+C so that only the node.js instance is exited and not gulp.
    process.on('SIGINT', function () {
      cp.kill();
      swig.log();
      swig.log.success(null, 'Terminating App');
    });
  }

  gulp.task('run', ['zk'], function (cb) {

    var errors;

    swig.log();
    swig.log('NOTE:'.yellow + ' Currently this tool is limited to node.js apps.\n');

    if (node.exists()) {
      swig.log.task('Checking validity of the app');
      errors = node.valid();

      if (!errors.length) {

        if (swig.argv.debug) {
          node.args.push('--debug');
        }

        swig.log.task('Running app');
        swig.log();
        run(cb);
      }
      else {
        swig.log.error('swig-app', 'Couldn\'t start your app due to the following:\n' + errors.join('\n'));
      }
    }
    else {
      swig.log.error('swig-app', 'No node.js apps found in this directory.');
    }

  });

};
