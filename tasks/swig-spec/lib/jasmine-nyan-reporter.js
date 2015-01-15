(function() {
  if (!jasmine) {
    throw new Exception("Jasmine library does not exist in global namespace!");
  }

  function isObject (obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  function extend (obj) {
    if (!isObject(obj)) return obj;
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
      source = arguments[i];
      for (prop in source) {
        obj[prop] = source[prop];
      }
    }
    return obj;
  };

  function write (string) {
    process.stdout.write(string);
  }

  function color (what, colorValue) {
    return '\u001b[' + colorValue + 'm' + what + '\u001b[0m';
  }

  var cursor,
    colors,
    isatty = true,
    window = { width: 0 };

  colors = {
    'pass': 90,
    'fail': 31,
    'bright pass': 92,
    'bright fail': 91,
    'bright yellow': 93,
    'pending': 36,
    'suite': 0,
    'error title': 0,
    'error message': 31,
    'error stack': 90,
    'checkmark': 32,
    'fast': 90,
    'medium': 33,
    'slow': 31,
    'green': 32,
    'light': 90,
    'diff gutter': 90,
    'diff added': 42,
    'diff removed': 41,
    'grey': 30
  };

  cursor = {
    hide: function () {
      isatty && process.stdout.write('\u001b[?25l');
    },

    show: function () {
      isatty && process.stdout.write('\u001b[?25h');
    },

    deleteLine: function () {
      isatty && process.stdout.write('\u001b[2K');
    },

    beginningOfLine: function () {
      isatty && process.stdout.write('\u001b[0G');
    },

    up: function (n) {
      process.stdout.write('\u001b[' + n + 'A');
    },

    down: function (n) {
      process.stdout.write('\u001b[' + n + 'B');
    },

    CR: function () {
      if (isatty) {
        cursor.deleteLine();
        cursor.beginningOfLine();
      }
      else {
        process.stdout.write('\r');
      }
    }
  };

  function NyanReporter (options) {

    window.width =
      isatty
        ? process.stdout.getWindowSize ? process.stdout.getWindowSize(1)[0] : 775
        : 775;

    var defaults = {
        useColor: true,
        isatty: true
      },
      width = window.width * .75 | 0,
      rainbowColors = this.rainbowColors = this.generateColors(),
      colorIndex = this.colorIndex = 0,
      numerOfLines = this.numberOfLines = 4,
      trajectories = this.trajectories = [[], [], [], []],
      nyanCatWidth = this.nyanCatWidth = 11,
      trajectoryWidthMax = this.trajectoryWidthMax = (width - nyanCatWidth),
      scoreboardWidth = this.scoreboardWidth = 5,
      tick = this.tick = 0,
      n = 0;

    this.options = extend(options, defaults);
    this.failedSpecs = [];
    this.started = false;
    this.finished = false;
    this.failed = 0;
    this.passed = 0;
    this.pending = 0;
    this.total = 0;
    this.startTime = 0;

    isatty = options.isatty;
  }

  NyanReporter.prototype = {

    reportRunnerStarting: function (runner) {
      cursor.hide();

      this.startTime = (new Date()).getTime();
      this.pending = runner.specs().length;

      this.draw();
    },

    reportRunnerResults: function (runner) {

      this.failed = this.total - this.passed;

      cursor.down(this.numberOfLines);

      this.epilogue();

      cursor.show();

      this.finished = true;
    },

    reportSuiteResults: function (suite) {
      var results = suite.results();
      this.draw();
    },

    reportSpecStarting: function (spec) {
      this.started = true;
      this.total++;
      this.draw();
    },

    reportSpecResults: function (spec) {

      var results = spec.results(),
        result,
        fail;

      this.pending--;

      if (results.skipped) {
        return;
      }

      if (results.passed()) {
        this.passed++;
      }
      else {

        fail = {
          id: spec.id,
          desc: spec.description,
          results: [].concat(results.getItems()),
          suite: {
            id: spec.suite.id,
            desc: spec.suite.description
          }
        };

        this.failedSpecs.push(fail);
        this.failed++;
      }

      this.draw();
    },

    epilogue: function () {
      var duration = (new Date()).getTime() - this.startTime,
        indent = '   ',
        spec,
        result,
        parts;

      write('\n' + indent + color(this.passed + ' passing', colors['bright pass']) + color(' (' + duration + 'ms)\n', colors.pass));

      if (this.failed > 0) {
        write(indent + color(this.failed + ' failing\n\n', colors['bright fail']));

        for (var i = 0; i < this.failedSpecs.length; i++) {
          spec = this.failedSpecs[i];
          write(indent + color((i + 1) + ') ' + spec.suite.desc + ': ' + spec.desc + ':\n', colors['error title']));

          for(var resultIndex = 0; resultIndex < spec.results.length; resultIndex++) {
            result = spec.results[resultIndex];

            if (result.trace.stack) {
              parts = result.trace.stack.split('\n');

              write(indent + indent + color(parts.shift(), colors['error message']) + '\n');
              write(indent + color(parts.join('\n' + indent), colors['error stack']) + '\n');
            }
            else {
              write(indent + indent + color(result.message, colors['error message']) + '\n');
            }

            write('\n');
          }
        }
      }
      else {
        write('\n');
      }

      write('\n');

    },

    /**
     * Draw the nyan cat
     *
     * @api private
     */
    draw: function () {
      this.appendRainbow();
      this.drawScoreboard();
      this.drawRainbow();
      this.drawNyanCat();
      this.tick = !this.tick;
    },

    /**
     * Draw the "scoreboard" showing the number
     * of passes, failures and pending tests.
     *
     * @api private
     */
    drawScoreboard: function () {

      function draw(color, n) {
        n = Math.max(parseInt(n), 0);

        write(' ');
        write('\u001b[' + color + 'm' + n + '\u001b[0m');
        write('\n');
      }

      draw(colors.green, this.passed);
      draw(colors.fail, this.failed);
      draw(colors.pending, this.pending + ' ');
      write('\n');

      cursor.up(this.numberOfLines);
    },

    /**
     * Append the rainbow.
     *
     * @api private
     */
    appendRainbow: function () {
      var segment = this.tick ? '_' : '-';
      var rainbowified = this.rainbowify(segment);

      for (var index = 0; index < this.numberOfLines; index++) {
        var trajectory = this.trajectories[index];
        if (trajectory.length >= this.trajectoryWidthMax) trajectory.shift();
        trajectory.push(rainbowified);
      }
    },

    /**
     * Draw the rainbow.
     *
     * @api private
     */
    drawRainbow: function () {
      var self = this;

      this.trajectories.forEach(function(line, index) {
        write('\u001b[' + self.scoreboardWidth + 'C');
        write(line.join(''));
        write('\n');
      });

      cursor.up(this.numberOfLines);
    },

    /**
     * Draw the nyan cat
     *
     * @api private
     */
    drawNyanCat: function () {
      var self = this;
      var startWidth = this.scoreboardWidth + this.trajectories[0].length;
      var color = '\u001b[' + startWidth + 'C';
      var padding = '';

      write(color);
      write('_,------,');
      write('\n');

      write(color);
      padding = self.tick ? '  ' : '   ';
      write('_|' + padding + '/\\_/\\ ');
      write('\n');

      write(color);
      padding = self.tick ? '_' : '__';
      var tail = self.tick ? '~' : '^';
      var face;
      write(tail + '|' + padding + this.drawFace() + ' ');
      write('\n');

      write(color);
      padding = self.tick ? ' ' : '  ';
      write(padding + '""  "" ');
      write('\n');

      cursor.up(this.numberOfLines);
    },

    /**
     * Draw nyan cat face.
     *
     * @return {String}
     * @api private
     */
    drawFace: function () {
      if (this.failed) {
        return '( x .x)';
      }
      else if (this.pending) {
        return '( o .o)';
      }
      else if(this.passed) {
        return '( ^ .^)';
      }
      else {
        return '( - .-)';
      }
    },

    /**
     * Generate rainbow colors.
     *
     * @return {Array}
     * @api private
     */
    generateColors: function () {
      var colors = [];

      for (var i = 0; i < (6 * 7); i++) {
        var pi3 = Math.floor(Math.PI / 3);
        var n = (i * (1.0 / 6));
        var r = Math.floor(3 * Math.sin(n) + 3);
        var g = Math.floor(3 * Math.sin(n + 2 * pi3) + 3);
        var b = Math.floor(3 * Math.sin(n + 4 * pi3) + 3);
        colors.push(36 * r + 6 * g + b + 16);
      }

      return colors;
    },

    /**
     * Apply rainbow to the given `str`.
     *
     * @param {String} str
     * @return {String}
     * @api private
     */
    rainbowify: function (str) {
      var color = this.rainbowColors[this.colorIndex % this.rainbowColors.length];
      this.colorIndex += 1;
      return '\u001b[38;5;' + color + 'm' + str + '\u001b[0m';
    }

  };

  jasmine.NyanReporter = NyanReporter;
})();