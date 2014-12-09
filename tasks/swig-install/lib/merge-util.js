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

// handles merging module packages
module.exports = function (gulp, swig) {

  var options,
    packagePath,
    _ = require('underscore'),
    fs = require('fs'),
    path = require('path'),
    glob = require('glob'),
    target;

  return {
    extract: function (pkg, deps, origin) {
      deps = deps || {};

      function push (name, version) {
        if (!deps[name]) {
          deps[name] = [];
        }
        deps[name].push({ version: version, origin: origin });
      }

      _.each((pkg.gilt && pkg.gilt.uiDependencies) || pkg.dependencies, function (value, key) {
        push(key, value);
      });

      if (pkg.lazyDependencies) {
        _.each(pkg.lazyDependencies, function (value, key) {
          push(key, value);
        });
      }

      return deps;
    },

    iterate: function (depTree) {
      var results = {},
        conflictFound = false,
        message;

      swig.log.task('Checking for dependency conflicts');

      _.each(depTree, function (versions, name) {
        var ver = _.reduce(_.pluck(versions, 'version'), function (memo, version) {
          var comparer;

          // Are the 2 versions are identical?
          if (!memo || version === memo) {
            return version;
          }

          // Are they both explicit versions? (and not identical)
          if (memo.match(/\d+\.\d+\.\d+\w*/) && version.match(/\d+\.\d+\.\d+\w*/)) {
            return null;
          }

          // Check to see if one version has any wildcards that match the other version
          comparer = memo + ' ?= ' + version;

          if (comparer.match(/(\d+\.\d+)\.x \?= \1\.\d+\w*/) ||
              comparer.match(/(\d+)\.x\.x \?= \1\.\d+\.(\d+|x)\w*/) ||
              comparer.match(/(?:x\.x\.x|\*) \?= (\d+|x)\.(\d+|x)\.(\d+|x)\w*/)) {
            return version;
          }

          // Reverse, and recheck
          comparer = version + ' ?= ' + memo;

          if (comparer.match(/(\d+\.\d+)\.x \?= \1\.\d+\w*/) ||
              comparer.match(/(\d+)\.x\.x \?= \1\.\d+\.(\d+|x)\w*/) ||
              comparer.match(/(?:x\.x\.x|\*) \?= (\d+|x)\.(\d+|x)\.(\d+|x)\w*/)) {
            return memo;
          }

          return null;

        }, null);

        if (!ver) {
          swig.log();
          message = 'Please resolve multiple versions of ' + name.red + ':\n';

          _.each(versions, function (version) {
            message += swig.log.padLeft(version.version + ' (in ' + version.origin.bold + ')\n', 3);
          });

          swig.log.error(null, message);

          conflictFound = true;
        }
        else {
          swig.log(swig.log.padLeft(swig.log.symbols.success + '  ' + name + ' v' + ver, 2));
          results[name] = ver;
        }

      });

      if (conflictFound) {
        swig.log.error('install:package-merge', 'Package Merge: module version conflict found (scroll up if you can\'t see the conflict).');
        process.exit(0);
      }

      swig.log();

      return results;
    },

    generate: function (deps, key) {
      swig.log.task('Writing merged package.json');

      // if a task is requesting install and needs devDependencies to be available
      // it can use the --devDependencies flag or set it manually on swig.argv.
      if (swig.argv.devDependencies) {
        deps = _.extend(deps, swig.pkg.devDependencies || {});
      }

      var packageTempPath = path.join(swig.temp, (key ? key + '-' : '') + 'package.json'),
        pkg = { dependencies: deps },
        internalModules = {
          'internal.browser_detect' : '0.1.x',
          'internal.json' : '2.0.x',
          'internal.less' : '1.6.x',
          'internal.modernizr' : '2.5.x',
          'internal.require' : '2.1.x',
          'internal.require_wrapper' : '0.1.x',
          'less.helpers' : '0.2.x'
        };

      if (fs.existsSync(packageTempPath)) {
        fs.unlinkSync(packageTempPath); // posix name for 'delete'
      }

      // extend the dependencies with the internal module requirements (require, require_wrapper, etc.)
      pkg.dependencies = _.extend(pkg.dependencies, internalModules);

      fs.writeFileSync(packageTempPath, JSON.stringify(pkg, null, 2));

      swig.log(swig.log.padLeft(' package.json: ' + packageTempPath.grey + '\n', 1));
    }
  };

};