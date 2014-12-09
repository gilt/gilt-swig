// this is a port of mocha-phantomjs
(function () {

  if (phantom.version.major < 1 || (phantom.version.major === 1 && phantom.version.minor < 9)) {
    console.log('jasmine-phantomjs requires PhantomJS > 1.9.1');
    phantom.exit(-1);
  }

  var system = require('system'),
    webpage = require('webpage'),
    argv = require('minimist')(system.args.slice(2));

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

  function verbose () {
    if (argv.verbose) {
      console.log.call(this, arguments);
    }
  }

  function JasmineRunner () {

    this.columns = parseInt(system.env.COLUMNS || 75) * .75 | 0
    this.output = system.stdout;
    this.startTime = Date.now();
    this.startTimeout = 6000;
    this.url = system.args[1];
    this.system = system;

    if (!this.url) {
      this.fail('Usage: phantomjs jasmine-phantomjs.js URL');
    }
  }

  JasmineRunner.prototype = {

    fail: function (message, errorNumber, stack) {
      if (message) {
        system.stderr.write(message + '\n' + stack + '\n');
      }

      // var ignorePatterns = [
      //   /SyntaxError: Parse error/
      // ];

      // for (var i = 0; i < ignorePatterns.lenght; i++){
      //   if (ignorePatterns.test(message)) {
      //     return;
      //   }
      // }

      // return phantom.exit(errorNumber || 1);
    },

    finish: function () {
      return phantom.exit(this.page.evaluate(function () {
        return window.__runner.failures;
      }));
    },

    hasStarted: function () {
      var started = this.page.evaluate(function() {
        return window.__runner.started;
      });

      if (!started && this.startTimeout && this.startTime + this.startTimeout < Date.now()) {
        this.fail("Failed to start jasmine: Init timeout", 255);
      }

      return started;
    },

    init: function () {
      this.initPage();
      return this.loadPage();
    },

    initPage: function () {
      var cookies = [],
        self = this,
        cookie;

      this.page = webpage.create({
        settings: {}
      });

      for (var i = 0; i < cookies.length; i++) {
        cookie = cookies[i];
        this.page.addCookie(cookie);
      }

      this.page = extend(this.page, {

        onConsoleMessage: function (message) {
          return system.stdout.writeLine('[console] ' + message);
        },

        onError: function (message, traces) {
          var file, index, line, trace;

          if (self.page.evaluate(function () { return window.onerror != null; })) {
            console.log('window.onerror');
            return;
          }

          for (var index = 0; index < traces.length; index++) {
            trace = traces[index];
            line = trace.line;
            file = trace.file;
            traces[index] = '  ' + file + ':' + line;
          }

          return self.fail(message, 0, traces.join('\n'));
        },

        onInitialized: function () {

          var result = self.page.evaluate(function (process) {

            window.jasmineEnv = null;
            window.process = process;
            window.__runner = {
              env: process.env,
              failures: 0,
              finished: false,
              started: false,

              run: function (options) {
                jasmineEnv = options.jasmine || jasmine.getEnv();
                jasmineEnv.updateInterval = 1000;

                if (options.reporters) {
                  for (var i = 0; i < options.reporters.length; i++) {
                    jasmineEnv.addReporter(options.reporters[i]);
                  }
                }

                window.__runner.started = true;

                // this will trigger this.page.onCallback
                window.callPhantom({ '__runner.run': true });

                return true;
              }
            };

            return window.__runner;

          }, system);

          return result;
        },

        onResourceError: function (resErr) {
          var message = 'Error loading resource ' + resErr.url + ' (' + resErr.errorCode + ').\nDetails: ' + resErr.errorString;
          return system.stderr.writeLine(message);
        }
      });

    },

    injectJS: function () {

      if (this.page.evaluate(function () { return window.jasmine != null; })) {
        this.page.injectJs('phantom-extensions.js');

        return true;
      }
      else {
        this.fail("Failed to find mocha on the page.");
        return false;
      }
    },

    loadPage: function () {

      var self = this;

      // this is triggered by any call to window.callPhantom
      this.page.onCallback = function (data) {

        // sent from phantom-extensions.js
        if (data && data.hasOwnProperty('jasmine.process.stdout.write')) {
          self.output.write(data['jasmine.process.stdout.write']);
        }
        // sent from window.__runner.run
        else if (data && data.hasOwnProperty('__runner.run')) {
          if (self.injectJS()) {
            self.waitToStartJasmine();
          }
        }

        return true;
      };

      this.page.onLoadFinished = function (status) {

        self.page.onLoadFinished = function () {};

        if (status !== 'success') {
          self.onLoadFailed();
        }

        return self.waitForRunnerStart();
      };

      this.page.open(this.url);
    },

    onLoadFailed: function () {
      return this.fail("Failed to load the url: " + this.url);
    },

    // this runs in the context of a phantomjs page.
    phantomRunner: function () {

      try {

        // we're creating a simple reporter to:
        // 1. track stats on the specs run
        // 2. mimic a 'finished' callback
        function FinishedReporter () {
          this.total = this.passed = this.failed = 0;
        }

        FinishedReporter.prototype = {
          reportRunnerResults: function (runner) {
            window.__runner.failures = this.failed;
            window.__runner.passed = (this.failed === 0);
            window.__runner.finished = true;
          },

          reportSpecStarting: function (spec) {
            this.total++;
          },

          reportSpecResults: function(spec) {
            if (spec.results().skipped) {
              return;
            }

            spec.results().passed() ? this.passed++ : this.failed++;
          }
        };

        // this reporter is always added last
        jasmineEnv.addReporter(new FinishedReporter());

        jasmineEnv.execute();

        return true;
      }
      catch (e) {
        var out = 'Script Error in PhantomJS\n\nMessage:\n  ' + e.message +
          '\nStack:\n  ' + e.stack + '\n';

        console.log(out);

        return false;
      }
    },

    runJasmine: function () {

      var result = this.page.evaluate(this.phantomRunner);

      if (result) {
        this.startTime = new Date().getTime();

        return this.waitForJasmine();
      }
      else {
        return this.fail("Failed to start jasmine.");
      }
    },

    waitForJasmine: function () {

      var finished = this.page.evaluate(function () { return window.__runner.finished; }),
        self = this;

      if (finished) {
        return this.finish();
      }
      else {
        return setTimeout(function () { self.waitForJasmine(); }, 100);
      }
    },

    waitForRunnerStart: function () {

      var self = this;

      if (!this.hasStarted()) {
        return setTimeout(function () { self.waitForRunnerStart(); }, 100);
      }
    },

    waitToStartJasmine: function () {

      var self = this;

      if (this.hasStarted()) {
        return this.runJasmine();
      }
      else {
        return setTimeout(function () { self.waitToStartJasmine(); }, 100);
      }
    }

  };

  (new JasmineRunner()).init();

}).call(this);
