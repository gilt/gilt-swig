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

module.exports = function (swig) {

  var fs = require('fs'),
    path = require('path');

  swig.fs = {

    findup: require('findup-sync'),

    //https://raw.githubusercontent.com/substack/node-mkdirp/master/index.js
    mkdir: function (p, mode, made) {
      if (mode === undefined) {
        mode = 0777 & (~process.umask());
      }
      if (!made) made = null;

      if (typeof mode === 'string') mode = parseInt(mode, 8);
      p = path.resolve(p);

      try {
        fs.mkdirSync(p, mode);
        made = made || p;
      }
      catch (err0) {
        switch (err0.code) {
          case 'ENOENT' :
          made = swig.fs.mkdir(path.dirname(p), mode, made);
          swig.fs.mkdir(p, mode, made);
          break;
          default:
          var stat;
          try {
            stat = fs.statSync(p);
          }
          catch (err1) {
            throw err0;
          }
          if (!stat.isDirectory()) throw err0;
          break;
        }
      }

      return made;
    },

    copyAll: function (src, dest) {
      var exists = fs.existsSync(src),
        stats = exists && fs.statSync(src),
        isDirectory = exists && stats.isDirectory();

      if (exists && isDirectory) {
        swig.fs.mkdir(dest);
        fs.readdirSync(src).forEach(function (childItemName) {
          swig.fs.copyAll(path.join(src, childItemName),
            path.join(dest, childItemName));
        });
      } else {
        fs.linkSync(src, dest);
      }
    }

  };

};
