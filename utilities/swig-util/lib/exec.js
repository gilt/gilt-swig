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

  /*
  *  copied from https://raw.githubusercontent.com/visionmedia/co-exec/master/index.js
  *  since they don't support returning stderr just yet.
  */

  var _ = require('underscore'),
    exec = require('child_process').exec;

  function capture (process, outHandler, errHandler) {
    var stdout = process.stdout,
      stderr = process.stderr,
      outBuff = '',
      errBuff = '';

    if (outHandler) {
      stdout.on('data', function (data) {
        outBuff += data.toString('utf8');

        if (outBuff.indexOf('\n') > -1) {
          outHandler(outBuff);
          outBuff = '';
        }
      });
    }

    if (errHandler) {
      stderr.on('data', function (data) {
        errBuff += data.toString('utf8');

        if (errBuff.indexOf('\n') > -1) {
          errHandler(errBuff);
          errBuff = '';
        }
      });
    }
  }

  // return a thunk for yield/generator functionality
  swig.exec = function swigExec (cmd, opts, options) {
    opts = _.extend(opts || {}, { maxBuffer: 20 * 1024 * 1024 }); // increase max buffer to 20mb

    return function swigExecThunk (done){
      var process = exec(cmd, opts, function execCb (err, stdout, stderr){
        done(err, { stdout: stdout, stderr: stderr });
      });
      if (options) {
        if (options.stdout || options.stderr) {
          capture(process, options.stdout, options.stderr);
        }

        if (options.start) {
          start(process);
        }
      }
    };
  };
};
