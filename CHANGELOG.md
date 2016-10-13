### 1.0.0
- Breaking Changes:
  - The reworked `swig assets-deploy` will now produce JS artifacts inside the
    `public/js/<app-name>/app` folder. The bundler will fetch from that folder
    and will continue to create merged/minified assets in `public/js/<app-name>`
    Applications that were defining their dependencies by prefixing their id
    with `src.` must now change it to `app.` or start using ES6 modules instead.

- Improvements:
  - Introduced new `swig transpile-scripts` task, used to transform ES6 and
    React JSX code to ES5 code.
  - Added new watcher to the run task to automatically transpile scripts:
    `swig run --watch-scripts`. You can also call it standalone with
    `swig watch-scripts`.