#!/usr/bin/env node

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

var _ = require('underscore'),
  fs = require('fs'),
  mustache = require('mustache'),
  path = require('path'),
  argv = require('yargs').argv,

  cwd = process.cwd(),

  fileName = argv._[0],
  filePath = path.join(cwd, fileName),

  pkg = require(path.join(cwd, 'package.json')),
  name = pkg.name.replace('@gilt-tech/', ''),
  globalName = null,
  deps = [],
  fnDeps = '',

  encoding = { encoding: 'utf-8' },
  content = fs.readFileSync(filePath, encoding),
  template = fs.readFileSync(path.join(__dirname, 'templates/vendor-module.mustache'), encoding);

if (!(pkg.gilt && pkg.gilt.vendor) && pkg.global_var) {
  throw 'Please move the "global_var" property to "gilt": { "vendor": { "globalName": } } in package.json';
}

// do some stubbing so we can avoid more logical checks
pkg.gilt =  pkg.gilt || { vendor: {} };
pkg.gilt.vendor =  pkg.gilt.vendor || {};

globalName = pkg.gilt.vendor.globalName || name.split('.').pop();

deps = _.map(_.keys(pkg.dependencies), function (dep) {
    return dep.replace('@gilt-tech/', '');
  });

fnDeps = _.map(deps, function (dep) {
    var pkgPath = path.join(cwd, 'node_modules/@gilt-tech', dep, 'package.json'),
      depPkg = require(pkgPath),
      result = depPkg.global_var;

    if (!result && depPkg.gilt && depPkg.gilt.vendor) {
      result = depPkg.gilt.vendor.globalName;
    }

    return result || dep.split('.').pop();
  })
  .join(', ');

// fnDeps = _.map(deps, function (dep) {
//     return defaultNames[dep] || dep;
//   }).join(', ');

deps = _.map(deps, function (dep) {
    return '  \'' + dep + '\'';
  })
  .join(',\n');

console.log(mustache.render(template, {
  content: content,
  name: name,
  globalName: globalName,
  deps: '\n' + deps + '\n',
  fnDeps: fnDeps
}));

throw 'error';

