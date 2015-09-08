module.exports = function (gulp, swig) {

  var _ = require('underscore'),
    path = require('path'),
    fs = require('fs'),
    co = require('co'),
    git = require('co-exec'),
    mustache = require('mustache'),
    gutil = require('gulp-util'),
    thunkify = require('thunkify'),
    inline = thunkify(require('inline-css')),
    Minimize = require('minimize');

  function * gitDiff (previousTag) {

    swig.log.info('', 'Fetching Diff');

    // git diff tracking_api.signal_direct-0.1.0 -- /github/ui-tracking/src/tracking_api/signal_direct

    var command = 'git diff ' + previousTag + ' -- ' + swig.target.path,
      results = yield git(command, { cwd: swig.target.path });

    return results;
  }

  function * gitLog (previousTag, currentTag) {

    swig.log.info('', 'Fetching Log for ' + currentTag);

    // git log tracking_api.signal_direct-0.1.0..tracking_api.signal_direct-0.1.1 -- /github/ui-tracking/src/tracking_api/signal_direct

    var command = 'git log ' + previousTag + '..' + currentTag + ' -- ' + swig.target.path,
      results = yield git(command, { cwd: swig.target.path });

    return results;
  }

  function * gitTag () {

    swig.log.info('', 'Fetching Tags');

    // git tag -l "tracking_api.signal_direct*" --sort=-refname
    var command = 'git tag -l "' + swig.pkg.name + '-*" --sort=-refname',
      results = yield git(command, { cwd: swig.target.path }),
      bits = results.split('\n'),
      prev = bits.length > 1 ? bits[1] : null,
      current = bits.length > 0 ? bits[0] : 'HEAD',
      isNewModule = false;

    if (!prev) {
      // git describe --abbrev=0 --tags tracking_api.signal_direct-0.1.1^
      command = 'git describe --abbrev=0 --tags ' + current + '^';
      results = yield git(command, { cwd: swig.target.path });
      prev = results;
      isNewModule = true;
    }

    return { previous: prev, current: current, isNewModule: isNewModule };
  }

  function * gitEmail () {

    swig.log.info('', 'Fetching Author\'s Email Address');

    var command = 'git config --get user.email',
      result = yield git(command, { cwd: swig.target.path });

    return result.trim();
  }

  function fill (slots) {
    return slots > 0 ? new Array(slots) : [];
  }

  function render (diff) {

    var result = '',
      data = _.extend(diff, {}),
      template = fs.readFileSync(path.join(__dirname, 'templates/email.handlebars'), 'utf-8');

    _.each(diff.files, function (file) {

      var deletes = file.deletions,
        adds = file.additions,
        normals = 0,
        difference;

      // create the github style adds/deletes block graph
      if (file.additions + file.deletions > 5) {
        difference = (deletes + adds) / 5; // we prefer to only show 5 blocks, round up

        adds = Math.round(adds / difference);
        deletes = Math.round(deletes / difference);

        if (deletes >= 5 ) {
          adds = 0;
        }
        else if (adds >= 5) {
          deletes = 0;
        }
      }
      else {
        normals = 5 - (adds + deletes);
      }

      file.graph = { plus: fill(adds), minus: fill(deletes), normal: fill(normals) };
      file.total = file.additions + file.deletions;
    });

    data.repo = swig.target.repo;
    data.commits = data.commits
                    .replace(/<(.*)>/g, '&lt;<a href="mailto:$1">$1</a>&gt;')
                    .replace(/\b((?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|])/g, '<a href="$1">$1</a>')
                    .replace(/\b([A-Z]+-\d+)\b/, '<a href="https://jira.gilt.com/browse/$1">$1</a>')
                    .replace(/(commit )([0-9a-f]{5,40})/, '$1<a href="https://gerrit.gilt.com/gitweb.cgi?p=' + data.repo + '.git;a=commit;h=$2">$2</a>')
                    .replace(/(Change-Id: |commit )([A-Z][a-f\d]{40})/, '$1<a href="https://gerrit.gilt.com/#/q/$2,n,z">$2</a>')
                    .replace(/(Author: )((\w|\s)+)/, '$1<strong>$2</strong>')
                    .replace(/(Date: )((\w|\s|\d|\:|\-)+)/, '$1<strong>$2</strong>')
                    .replace(/\n/g, '<br/>');

    result = mustache.render(template, data);

    return result;
  }

  gulp.task('release-email', co(function * () {

    if (!swig.argv.module) {
      swig.log.error('', 'release-email is only for use with modules. please specify the --module argument.');
      return;
    }

    swig.log.task('Generating Module Release Email');

    var tags = yield gitTag(),
      log = yield gitLog(tags.previous, tags.current),
      rawDiff = yield gitDiff(tags.previous),
      sender = yield gitEmail(),
      minimize = new Minimize({
        empty: false,
        spare: false,
        quotes: true
      }),
      recipients = [], //'federal-ui-alerts@gilt.com'
      result,
      diff,
      html;

      swig.log.info('', 'Parsing Diff');

      diff = swig.diff(rawDiff);
      diff = _.extend(diff, {
        moduleName: swig.argv.module,
        toVersion: swig.pkg.version,
        fromVersion: tags.previous.replace(swig.pkg.name + '-', '')
      });

      swig.log.info('', 'Rending HTML');

      diff.commits = log;

      html = render(diff);

      fs.writeFileSync(path.join(__dirname, 'email.html'), html);

      //https://github.com/jonkemp/inline-css
      html = yield inline(html, {
        applyStyleTags: true,
        removeStyleTags: true
      });

      // remove class="" attributes since we no longer need them.
      html = html.replace(/\s*(?:\s+class)\s*=\s*"[^"]*"/g, '');

      // replace other annoying things to make the html smaller.
      html = html.replace(/\&apos\;/g, '\'');
      html = html.replace(/\&quote\;/g, '"');
      html = html.replace(/\&\#x25A0\;/g, '■'); // the inliner replaces these

      fs.writeFileSync(path.join(__dirname, 'email-inlined.html'), html);

      // gmail has a 102k limit on html content before it starts "clipping" it.
      // this greatly reduces the size of the html file.
      minimize.parse = thunkify(minimize.parse);
      html = yield minimize.parse(html);

      // remove <code data-remove>. we have to have that in there
      // so Minimize will leave the whitespace alone
      html = html.replace(/\<code data\-remove\>/g, '');
      html = html.replace(/\<code\>\<\/td\>/g, '');

      fs.writeFileSync(path.join(__dirname, 'email-min.html'), html);

      swig.log();
      swig.log.task('Sending Email');

      if (swig.pkg.maintainers && _.isArray(swig.pkg.maintainers)) {
        swig.pkg.maintainers.forEach(function (maint) {
          if (maint.email) {
            recipients.push();
          }
        });
      }

      try {
        result = yield swig.email({
          from: 'swig-noreply@gilt.com',
          to: 'powella@gilt.com', //sender,
          replyTo: recipients,
          subject: '[module][' + swig.target.repo + '] ' + (tags.isNewModule ? 'New ' : '') +
                   diff.moduleName + ' v' + diff.fromVersion + ' → v' + diff.toVersion,
          text: '',
          html: html
        });
      }
      catch (e) {
        swig.log.error('', 'Unable to send the release email. You can retry using the `swig release-email` command.');
      }
  }));

};
