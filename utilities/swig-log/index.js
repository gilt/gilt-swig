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

  var _ = require('underscore'),
    hooker = require('hooker'),
    symbols = require('log-symbols'),
    readline = require('readline'),
    sprintf = require('sprintf-js').sprintf,
    strip = require('strip-ansi'),
    thunkify = require('thunkify'),

    linePrefix = '  ',
    lastLine = '',
    lastLineLength = 0;

  require('colors');
  '┤├';

  symbols.connector = ': ';
  symbols.start = '▸';

  if (swig.env === 'production' || swig.argv.pretty === false) {
    symbols.info =    '[ i ]';
    symbols.warning = '[ w ]';
    symbols.error =   '[ x ]';
    symbols.success = '[ o ]'
    symbols.connector = ': ';
    symbols.start = '>'
  }

  if (swig.env === 'development' && !swig.argv.poolparty) {
    var oldLog = console.log;

    // gulp-util.log always starts each log with [00:00:00]
    // we're suppressing that output if on a dev machine.
    console.log = function () {
      var args = Array.prototype.slice.call(arguments),
        suppress = true;

      if (/^\[\d\d\:\d\d:\d\d\]/.test(strip(args[0]))) {

        // if gulp is reporting an error, let that through.
        _.each(args, function (arg) {
          if (arg && (!_.isString(arg) ||
              arg.toLowerCase().indexOf('error') > -1) ||
              /Task \'(.+)\' is not in your gulpfile/.test(arg)) {
            suppress = false;
          }
        });

        if (suppress) {
          return;
        }
      }

      oldLog.apply(console, args);
    }
  }

  function puts (what) {

    what = what || '';

    if (_.isObject(what)) {
      console.log(what);
      return;
    }

    var newline = '\n',
      raw = strip(what),
      trailing = (raw.indexOf(newline) === raw.length - 1),
      lastIndex,
      lines;

    if (what.length === 0) {
      trailing = false;
    }

    // remove any trailing newlines. they suck.
    if (trailing) {
      lastIndex = what.lastIndexOf(newline);
      what = what.substr(0, lastIndex) + what.substr(lastIndex + 1);
    }

    lines = what.split(newline);

    if (lines.length > 1) {
      lines = _.each(lines, function (line, index) {
        lines[index] = (index > 0 ? linePrefix : '') + line;
      });

      what = lines.join('\n');
    }

    if (swig.env === 'production' || swig.argv.pretty === false) {
      what = strip(what);
    }

    lastLine = linePrefix + what;
    lastLineLength = strip(lastLine).length;

    what = lastLine  + (trailing ? newline : '');

    if (swig.argv.pretty === 'false') {
      what = strip(what);
    }

    console.log(what);
  }

  puts = _.extend(puts, {

    symbols: symbols,
    padding: linePrefix,
    strip: strip,

    write: function (what) {
      process.stdout.write(what || '');
    },

    verbose: function (what) {
      if (swig.argv.verbose) {
        puts(what);
      }
    },

    info: function (prefix, what) {
      puts.status(prefix, what, strip(symbols.info).cyan, 'cyan');
    },

    warn: function (prefix, what) {
      puts.status(prefix, what, symbols.warning, 'yellow');
    },

    error: function (prefix, what) {
      puts.status(prefix, what, symbols.error, 'red');
    },

    success: function (prefix, what) {
      puts.status(prefix, what, symbols.success, 'green');
    },

    status: function (prefix, what, symbol, color) {
      what = what || '';
      prefix = prefix || '';
      symbol = symbol || '';

      if (prefix) {
        prefix = (linePrefix + prefix)[color] + (what ? symbols.connector.white : '');
      }

      if (!prefix && what) {
        prefix = linePrefix;
      }

      puts(symbol + prefix + what);
    },

    task: function (name) {
      puts(symbols.start.white + linePrefix + name.cyan + ':');
    },

    padLeft: function (what, howMany) {
      return sprintf('%' + (howMany * linePrefix.length) + 's%s', '', what);
    },

    padRight: function (what) {
      return sprintf('%s%' + (howMany * linePrefix.length) + 's', what, '');
    },

    confirm: thunkify(function (question, callback) {
      var iface = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        }),
        result;

      iface.question(question + ' ', function (answer) {
        iface.close();

        answer = answer || 'n';
        answer = answer.toLowerCase();

        result = answer.substring(0, 1) === 'y';

        callback(null, result);
      });
    })

  });

  return puts;
};
