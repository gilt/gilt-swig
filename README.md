Swig
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
npm install swig-cli -g
```

  To use swig in any directory:
  
```
swig init && swig
```

  We recommend adding swig to your user directory, making the tools swig provides available in most terminal sessions.

For more information on swig's command line interface, see the [swig-cli README](https://github.com/gilt/gilt-swig/tree/master/swig-cli)

### Technical Requirements

  - [NVM](https://github.com/creationix/nvm)
    To manage and initialize the proper node versions for Swig to run.

  - `Node v0.11`Installed and managed by NVM, allows use of ECMA 6. Once nvm is installed, run:
  
```
nvm install 0.11
```
 
  - [NPM](https://www.npmjs.com/package/download)
    Bundled with required Node.js.

  - [Gulp](http://gulpjs.com/) Swig uses the latest version of gulp. If you're not familiar with Gulp, start there first.

## Development Information

Swig is broken down into a few different categories for the sake of organization and what each module actually does for us.

### The Parent Modules

These modules form the foundation of Swig.

  - `swig-cli`
    Intended to be installed globally, this module is the starting off point
    for using swig.

  - `swig-project`
    The launching point module installed in each local directory where swig
    is intended to be used. This 'parent' module contains the dependencies and
    setup code to allow swig to do it's thing.

### The Tasks

Tasks are modules which contain Gulp task definitions. Swig task definitions use plugins but are not plugins themselves. Consider the following command:

```
gulp build
```
In the command above, `build` is the name of the Gulp Task. That task will use Gulp plugins to serve its purpose. Swig Task Modueles contain Gulp tasks which operate on files and directories.

  - `swig-default`
    Registered as the default Gulp task. Displays information on available tasks.

  - `swig-bundle`
    WIP: Will handle Gilt's asset bundling processes for web applications.

  - `swig-deploy`
    WIP: Will handle Gilt's deploy process for web applications.

  - `swig-install`
    Installs all client-side requirements for a web application.
    (Gilt internal: This is snynomymous with ui-install)

  - `swig-lint`
    Lints javascript and less/css files and looks for other special considerations
    within a module or web-app's client-side source files.

  - `swig-publish`
    Publishes modules to the npm registry configured in .npmrc.
    This task runs linting, validation, and specs prior to allowing the publish
    to take place.

  - `swig-spec`
    Runs specs for web applications, ui-* modules, and npm modules.

### The Tools

  Tools are modules which serve a purpose that makes them contextually part of the
  tooling process Swig and Gulp do work for.

  - `swig-app-registry`
    Fetches a copy of an application registry for use in other tools. Looks in .swigrc
    for the location of the registry to fetch.

  - `swig-run`
    Runs a web application in an NVM isolated environment. Currently only supports
    Node.js applications which contain app.js at the root.

  - `swig-tunnel`
    Spins up an SSH tunnel for services. Looks in .swigrc for the tunnel configurations
    to use.

  - `swig-stub`
    Generates scaffolding for a Gilt-style web application. Presently limited to Node.js applications.

  - `swig-zk`
    Provides methods for starting and stopping Zookeeper.

### The Utilities

Utilities are standard CommonJS Node modules which contain objects, convenience functions, wrappers, etc that are used frequently and continuously within swig.

  - `swig-log`
    Provides mechanisms for sending output to the terminal.

  - `swig-util`
    Provides various common utilities to the swig ecosystem.


## Want to contribute?

Anyone can help make this project better - We follow the same contributing guide as the Gulp project. Please check out their [Contributing guide](/CONTRIBUTING.md)!
