import gulp from 'gulp';
import loadPlugins from 'gulp-load-plugins';
import webpack from 'webpack';
import crx from 'gulp-crx-pack';
import fs from 'fs';
import shell from 'gulp-shell';
import git from 'gulp-git';
import zip from 'gulp-zip';
import rimraf from 'rimraf';
import jsonEditor from 'gulp-json-editor';
import runSequence from 'run-sequence';

import webpackConfig from './webpack.config';

const plugins = loadPlugins();

gulp.task('build', (cb) => {
  webpack(webpackConfig, (err, stats) => {
    if (err) throw new plugins.util.PluginError('webpack', err);
    plugins.util.log('[webpack]', stats.toString());
    cb();
  });
});

gulp.task('zip', ['build'], () => {
  const manifest = JSON.parse(fs.readFileSync('./manifest.json', 'utf8'));
  const fileName = `${manifest.short_name}-${manifest.version}.zip`;
  return gulp.src('build/**')
  .pipe(zip(fileName))
  .pipe(gulp.dest('./dist'))
});

gulp.task('ensure-clean-tree', (cb) => {
  return git.status({ args: '-s', quiet: true }, (err, stdout) => {
    if (err) throw err;
    const lines = stdout.split(/[\n\r]+/g);
    if (lines.filter(l => l.trim().length > 0).length > 0) {
      throw new plugins.util.PluginError('git', 'There are modified files. Please commit or stash them in order to release.');
    }
  });
})

gulp.task('package', ['ensure-clean-tree', 'build'], () => {
  const manifest = JSON.parse(fs.readFileSync('./manifest-prod.json', 'utf8'));
  const fileName = `${manifest.short_name}-${manifest.version}.crx`;
  const crxHost = 'hosting-202.lhr4.prod.booking.com';
  const crxDir = '/var/www/crx.internal.booking.com/';

  return gulp.src('./build')
    .pipe(crx({
      privateKey: fs.readFileSync('../keys/bphone.pem', 'utf8'),
      filename: fileName,
    }))
    .pipe(gulp.dest('./dist'))
    .pipe(shell([
      `scp -q dist/${fileName} ${crxHost}:${crxDir}`,
      `echo "Done. Check http://crx.internal.booking.com/${fileName} to see if the package is synced"`,
    ], {
      verbose: true,
    }));
});

gulp.task('increment-version', () => {
  const manifest = require('./manifest-prod.json');
  const version = parseInt(manifest.version, 10);
  if (Number.isNaN(version)) {
      throw new Error(`Version must be a number, got ${manifest.version}`);
  }
  return gulp.src('./manifest-prod.json')
    .pipe(jsonEditor((json) => {
        json.version = version + 1;
        return json;
    }))
    .pipe(gulp.dest('./'))
    .pipe(git.add())
    .pipe(
      git.commit(`Incremented version to ${version + 1}`),
    );
});

gulp.task('clean', (cb) => {
  rimraf('./build', cb);
});

gulp.task('release', (cb) => {
  runSequence('clean', 'increment-version', 'package', cb);
});

gulp.task('default', ['build']);
