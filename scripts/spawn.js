const {fork} = require('child_process');
const {join, resolve} = require('path');

const managePath = require('manage-path');

const components = require('./update/components');

const binDirs = components
  .reduce((acc, {binDir}) => acc.concat(binDir), [])
  .map(binDir => resolve(join('build', 'bin', binDir)));

const envVars = components
  .filter(({env}) => env)
  .reduce((acc, {env}) => Object.assign({}, acc, env), {});

const env = Object.assign({}, process.env, envVars, {
  PATH: managePath(process.env).unshift(binDirs),
});

fork(join('scripts', process.argv[2]), [...process.argv.slice(3)], {env});
