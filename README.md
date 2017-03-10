## [DEPRECATED REPOSITORY]
We moved all the works to https://github.com/gilt/swig

Swig [![Build Status](https://travis-ci.org/gilt/gilt-swig.svg)](https://travis-ci.org/gilt/gilt-swig)
=========

Swig represents a pattern to manage a consistent gulp task structure across many projects and many developers within an organization.

The intention is to use Gulp as the community currently does, contribute to the Open Source Gulp community, encourage open development, reduce technical debt in tooling and encouraging collaboration.

### The What

Swig provides...

  - A quick and painless means to setup system requirements.
  - A consistent tooling task structure across the various web-app and module projects at an organization.
  - An automatic, unobtrusive update mechanism to keep all developers up to date.
  - Beautiful and meaningful output to the user for common tasks.
  - An optional environment launching point for Gulp.
  - Use of community-driven, open-source plugins that fit an organization’s unique needs whenever possible.
  - Tooling without the presence of proprietary code or tasks.

### The How

  Please reference the Technical Requirements below before proceeding.

  To use swig anywhere, you'll need swig-cli:

```
npm install -g @gilt-tech/swig
```

  To use swig in any directory:

```
swig init && swig
```

  We recommend adding swig to your user directory, making the tools swig provides available in most terminal sessions.

For more information on swig's command line interface, see the [swig-cli README](https://github.com/gilt/gilt-swig/blob/master/src/cli/swig-cli/README.md)

### Technical Requirements

  - [NVM](https://github.com/creationix/nvm)
    To manage and initialize the proper node versions for Swig to run.

  - Node.js v0.12, installed and managed by NVM. Once nvm is installed, run:

```
nvm install 0.12
```

  - [NPM](https://www.npmjs.com/package/download)
    Bundled with required Node.js.

  - [Gulp](http://gulpjs.com/) Swig uses the latest version of gulp. If you're not familiar with Gulp, start there first.

## Use and Structure

### The Parent Module

These modules form the foundation of Swig.

  - `swig`  
    Intended to be installed globally and locally, following the same patterns as gulp and grunt,
    this module is the starting off point for using swig. By default, swig contains dependencies on
    modules that facilitate Gilt's asset pipeline.

### CLI Flags

swig has a few flags that come in handy:

- `--poolparty`  
    Displays Gulp output and verbose output normally suppressed.

- `--pretty=false`  
    Instructs the output to strip colors and unicode characters.

- `--verbose`  
    Prints extended logging information.

### CLI Commands

- `swig`  
  The entry point for swig. If no parameters are used, runs the default task.

- `swig init`  
  Initializes swig within a local directory.

### The Tasks

Tasks are modules which contain Gulp task definitions. Swig task definitions use plugins but are not plugins themselves. Consider the following command:

```
gulp build
```
In the command above, `build` is the name of the Gulp Task. That task will use Gulp plugins to serve its purpose. Swig Task Modules contain Gulp tasks which operate on files and directories.

  - [swig-default](https://github.com/gilt/gilt-swig/tree/master/lib): `swig`  
    Registered as the default Gulp task. Displays information on available tasks.

  - [swig-bundle](https://github.com/gilt/gilt-swig-assets/tree/master/lib): `swig bundle`  
    WIP: Will handle Gilt's asset bundling processes for web applications.

  - [swig-deploy](https://github.com/gilt/gilt-swig-assets/tree/master/lib): `swig deploy`  
    WIP: Will handle Gilt's deploy process for web applications.

  - [swig-install](https://github.com/gilt/gilt-swig-assets/tree/master/lib): `swig install`  
    Installs all client-side requirements for a web application.
    (Gilt internal: This is synonymous with ui-install)

  - [swig-lint](https://github.com/gilt/gilt-swig-assets/tree/master/lib): `swig lint`  
    Lints javascript and less/css files and looks for other special considerations
    within a module or web-app's client-side source files.

  - [swig-publish](https://github.com/gilt/gilt-swig-assets/tree/master/lib): `swig publish`  
    Publishes modules to the npm registry configured in .npmrc.
    This task runs linting, validation, and specs prior to allowing the publish
    to take place.

  - [swig-spec](https://github.com/gilt/gilt-swig-assets/tree/master/lib): `swig spec`  
    Runs specs for web applications, ui-* modules, and npm modules.

  - [swig-stub](https://github.com/gilt/gilt-swig-assets/tree/master/lib): `swig stub`  
    Generates scaffolding for Gilt web applications and asset modules.

### Optional Tasks

  Tasks that aren't directly associated with Gilt's asset pipeline are relegated to
  separate repositories and are completely optional. Additional setup is required to use
  these modules.

  - [swig-docker](https://github.com/gilt/gilt-swig-docker): `swig docker`  
    Provides tasks for working with docker containers.

  - [swig-run](https://github.com/gilt/gilt-swig-run): `swig run`  
    Runs a web application in an NVM isolated environment. Currently only supports
    Node.js applications which contain app.js at the root.

  - [swig-zk](https://github.com/gilt/gilt-swig-run/tree/master/lib/swig-zk): `swig zk`  
    Provides methods for starting and stopping Zookeeper.

#### Using The Optional Tasks

  Using the optional tasks is fairly straightforward. An application's `gulpfile.js` must be updated.
  The pattern below can be followed for most applications:

  ```javascript
  var gulp = require('gulp'),
    swig = require('@gilt-tech/swig')(gulp);

  require('@gilt-tech/swig-docker')(gulp, swig);
  require('@gilt-tech/swig-run')(gulp, swig);
  ```

  And of course the dependencies for both `@gilt-tech/swig-docker` and `@gilt-tech/swig-run` would need
  to be added to the `dependencies` section of package.json, and the modules installed.

### Swig Utilities

[swig-util](https://github.com/gilt/gilt-swig-util) was created to provide various commonly-used utilities for the swig ecosystem. In addition to
producing beautiful output through the use of `swig.log`, swig will also intelligently suppress certain
superfelous `gulp` output.

## Want to contribute?

Anyone can help make this project better - We follow the same contributing guide as the Gulp project. Please check out their [Contributing guide](https:d//github.com/gulpjs/gulp/blob/master/CONTRIBUTING.md)!

### Publishing

When a [task](https://github.com/gilt/gilt-swig-assets) or [utility](https://github.com/gilt/gilt-swig-util) dependency is updated,
this module should also have it's patch version bumped, and published. This ensures that users will consistently have the latest
task dependencies for each version of swig. Exceptions can be made in the case of non-critical updates to task dependencies.
