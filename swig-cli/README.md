swig-cli Documentation
======================

### Flags

swig has a few flags that come in handy:

- `--poolparty`
    Displays Gulp output and verbose output normally suppressed.

- `--pretty=false`
    Instructs the output to strip colors and unicode characters.

- `--verbose`
    Prints extended logging information.

### Tasks

Tasks can be executed by running `swig <task>`.

swig-cli provides access to the following within the terminal:

- `swig`
  The entry point for swig. If no parameters are used, runs the default task.

- `swig init`
  Initializes swig within a local directory.

- `swig dev`
  Sets up an enviornment (preferably on a test directory) for easily developing
  for swig.
