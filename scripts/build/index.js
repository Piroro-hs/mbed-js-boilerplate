const {spawn, execSync} = require('child_process');
const {basename, join} = require('path');

const chokidar = require('chokidar');
const promisify = require('es6-promisify');
const minimist = require('minimist');
const rollup = require('rollup');
const buble = require('rollup-plugin-buble');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const uglify = require('rollup-plugin-uglify');

const {waitForSome} = require('./waitFor');

const copy = promisify(require('fs-extra').copy);

function log(arg) {
  console.log(arg);
  return arg;
}

const jsmbedPath = 'build/jerryscript/targets/mbedos5';

const {'out-dir': outDir, target, watch} = minimist(process.argv.slice(2), {
  boolean: [
    'watch',
  ],
  string: [
    'out-dir',
    'target',
  ],
  alias: {
    d: 'out-dir',
    w: 'watch',
  },
  default: {
    'out-dir': 'dist',
    target: execSync('mbed target', {cwd: jsmbedPath, encoding: 'utf8'}).replace(/^\[mbed]\s(.*)\s*/, '$1'), // [mbed] name\r\n
    watch: false,
  },
});

execSync(`python tools/generate_pins.py ${target}`, {cwd: jsmbedPath});

function build() {
  return rollup
    .rollup({
      entry: 'src/main.js',
      plugins: [
        buble({
          exclude: 'node_modules/**',
          transforms: {modules: false},
        }),
        commonjs(),
        nodeResolve({jsnext: true}),
        uglify(),
      ],
      // cache,
    })
    // .then(bundle => (cache = bundle))
    .then(bundle => bundle.write({dest: `${jsmbedPath}/js/main.js`, format: 'cjs'}))
    .then(() => new Promise((resolve, reject) => {
      const child = spawn('make', [`BOARD=${target}`], {cwd: jsmbedPath, stdio: 'inherit'});
      child.on('exit', resolve);
      child.on('error', reject);
    }))
    .then(() => waitForSome([
      `${jsmbedPath}/BUILD/${target.toLowerCase()}/GCC_ARM/mbedos5.bin`,
      `${jsmbedPath}/BUILD/${target.toLowerCase()}/GCC_ARM/mbedos5.hex`,
    ]))
    .then(path => copy(path, join(outDir, basename(path))))
    .catch((e) => {
      console.log(e);
    });
}

if (watch) {
  chokidar.watch('src/**/**.js')
    .on('ready', build)
    .on('change', build);
} else {
  build().then(process.exit);
}
