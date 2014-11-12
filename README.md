Swig
=========

Swig represents a pattern to manage a consistent gulp task structure across many projects and many developers within an organization.

The intention is to use Gulp as the community currently does, contribute to the Open Source Gulp community, encourage open development, reduce technical debt in tooling and encouraging collaboration.

What Swig Provides

  - Provide a quick and painless means to setup system requirements.
  - Provide a consistent tooling task structure across the various web-app and module projects at an organization.
  - Provide an automatic, unobtrusive update mechanism to keep all developers up to date.
  - Provide beautiful and meaningful output to the user for common tasks.
  - Provide an optional environment launching point for Gulp.
  - Use of community-driven, open-source plugins that fit an organization’s unique needs whenever possible.
  - Provide tooling without the presence of proprietary code or tasks.

Using Swig

  Please reference the Technical Requirements below before proceeding.

  To use swig anywhere, you'll need swig-cli:
  `npm install swig-cli -g`

  swig-cli provides access to the following within the terminal:

  - `swig`
    The entry point for swig. If no parameters are used, runs the default task.

  - `swig init`
    Initializes swig within a local directory.

  - `swig update`
    WIP

  - `swig dev`
    Sets up an enviornment (preferably on a test directory) for easily developing
    for swig.

  To use swig in any directory:
  `swig init && swig`

Technical Requirements

  - NVM
    To manage and initialize the proper node versions for Swig to run.

  - Node v0.11
    Installed and managed by NVM.
    Provides the ability to use cutting-edge ECMA 6.

  - NPM
    Bundled with required Node.js.

  - Gulp (latest)

Swig Modules

  - swig-cli
    Intended to be installed globally, this module is the starting off point
    for using swig.

  - swig-project
    The launching point module installed in each local directory where swig
    is intended to be used. This 'parent' module contains the dependencies and
    setup code to allow swig to do it's thing.

Swig Task Modules

  Tasks are modules which contain Gulp task definitions. Traditionally, task
  definitions use plugins but are not plugins. Consider the following
  command: `gulp build`. In that example command, `build` is the name of the
  Gulp Task. That task will use Gulp plugins to serve its purpose.

  - swig-bundle
    WIP: Will handle Gilt's asset bundling processes for web applications.

  - swig-default
    The default Gulp task. Displays information on available tasks.

  - swig-deploy
    WIP: Will handle Gilt's deploy process for web applications.

  - swig-install
    Installs all client-side requirements for a web application.
    (Gilt internal: This is snynomymous with ui-install)

  - swig-lint
    Lints javascript and less/css files and looks for other special considerations
    within a module or web-app's client-side source files.

  - swig-publish
    Publishes modules to the npm registry configured in .npmrc.
    This task runs linting, validation, and specs prior to allowing the publish
    to take place.

  - swig-spec
    Runs specs for web applications, ui-* modules, and npm modules.

Swig Tool Modules

  Tools are modules which serve a purpose that makes them contextually part of the
  tooling process Swig and Gulp do work for.

  - swig-app-registry
    Fetches a copy of an application registry for use in other tools. Looks in .swigrc
    for the location of the registry to fetch.

  - swig-run
    Runs a web application in an NVM isolated environment. Currently only supports
    Node.js applications which contain app.js at the root.

  - swig-tunnel
    Spins up an SSH tunnel for services. Looks in .swigrc for the tunnel configurations
    to use.

  - swig-zk
    Provides methods for starting and stopping Zookeeper.

Swig Utility Modules

  - swig-log
    Provides mechanisms for sending output to the terminal.

  - swig-util
    Provides various common utilities to the swig ecosystem.

Available Flags:

  --poolparty
    Displays Gulp output and verbose output normally suppressed.

  --pretty=false
    Instructs the output to strip colors and unicode characters.

  --verbose
    Prints extended logging information.


Contributing:
  TBD: This section describes our development process and how you can contribute.


(More information to follow once the RFC is complete.)
