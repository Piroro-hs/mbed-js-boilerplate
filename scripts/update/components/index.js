const {execSync: exec, spawnSync: spawn} = require('child_process');
const {resolve} = require('path');

const AdmZip = require('adm-zip');
const {
  accessSync: access,
  copySync: copy,
  outputFileSync: outputFile,
  renameSync: rename,
} = require('fs-extra');
const {sync: hasbin} = require('hasbin');

const selector = require('./selector');

const components = [
  {
    name: 'Python27',
    test() {
      return hasbin('python') && spawn('python', ['-V'], {encoding: 'utf8'}).output[2].startsWith('Python 2.7');
    },
    url: selector({
      win32ia32: 'https://www.python.org/ftp/python/2.7.12/python-2.7.12.msi',
      win32x64: 'https://www.python.org/ftp/python/2.7.12/python-2.7.12.amd64.msi',
    }),
    install: selector({
      win32ia32() {
        exec(`start /wait msiexec /a build\\tmp\\python-2.7.12.msi targetdir="${resolve('build/bin/Python27')}" /qn`);
      },
      win32x64() {
        exec(`start /wait msiexec /a build\\tmp\\python-2.7.12.amd64.msi targetdir="${resolve('build/bin/Python27')}" /qn`);
      },
      others: false,
    }),
    binDir: 'Python27',
  },
  {
    name: 'pip',
    test() {
      return hasbin('pip');
    },
    url: 'https://bootstrap.pypa.io/get-pip.py',
    install() {
      exec('python build/tmp/get-pip.py --user');
    },
    binDir: 'pip/Scripts',
    env: {
      PYTHONUSERBASE: resolve('build/bin/pip'),
    },
  },
  {
    name: 'Mercurial',
    test() {
      return hasbin('hg');
    },
    url: selector({
      win32ia32: 'https://www.mercurial-scm.org/release/windows/mercurial-4.0.0-x86.msi',
      win32x64: 'https://www.mercurial-scm.org/release/windows/mercurial-4.0.0-x64.msi',
    }),
    install: selector({
      win32ia32() {
        exec(`start /wait msiexec /a build\\tmp\\mercurial-4.0.0-x86.msi targetdir="${resolve('build/bin/mercurial')}" /qn`);
      },
      win32x64() {
        exec(`start /wait msiexec /a build\\tmp\\mercurial-4.0.0-x64.msi targetdir="${resolve('build/bin/mercurial')}" /qn`);
      },
      others() {
        exec('pip install mercurial --user');
      },
    }),
    binDir: selector({
      win32: 'Mercurial/PFiles/Mercurial',
      others: 'pip/Scripts',
    }),
  },
  {
    name: 'GCC',
    test() {
      return hasbin('arm-none-eabi-gcc');
    },
    url: selector({
      darwin: 'https://launchpad.net/gcc-arm-embedded/5.0/5-2016-q3-update/+download/gcc-arm-none-eabi-5_4-2016q3-20160926-mac.tar.bz2',
      linux: 'https://launchpad.net/gcc-arm-embedded/5.0/5-2016-q3-update/+download/gcc-arm-none-eabi-5_4-2016q3-20160926-linux.tar.bz2',
      win32: 'https://launchpad.net/gcc-arm-embedded/5.0/5-2016-q3-update/+download/gcc-arm-none-eabi-5_4-2016q3-20160926-win32.zip',
    }),
    install: selector({
      win32() {
        new AdmZip('build/tmp/gcc-arm-none-eabi-5_4-2016q3-20160926-win32.zip').extractAllTo('build/bin/gcc', true);
      },
      others() {
        selector({
          darwin() {
            exec('tar xjf ../tmp/gcc-arm-none-eabi-5_4-2016q3-20160926-mac.tar.bz2', {cwd: 'build/bin'});
          },
          linux() {
            exec('tar xjf ../tmp/gcc-arm-none-eabi-5_4-2016q3-20160926-linux.tar.bz2', {cwd: 'build/bin'});
          },
        })();
        rename('build/bin/gcc-arm-none-eabi-5_4-2016q3', 'build/bin/gcc');
      },
    }),
    binDir: 'gcc/bin',
  },
  {
    name: 'mbed-cli',
    test() {
      // return hasbin('mbed');
      return hasbin('mbed') && !exec('mbed --version', {encoding: 'utf8'}).startsWith('1.0.0'); // https://github.com/ARMmbed/mbed-cli/issues/398
    },
    // url: '',
    url: 'github:bridadan/mbed-cli#fix-config-root-error',
    install() {
      // exec('pip install mbed-cli --user');
      exec('pip install -e build/tmp/mbed-cli#fix-config-root-error --user -I');
    },
    binDir: 'pip/Scripts',
  },
  {
    name: 'Gow',
    test() {
      return process.platform !== 'win32' || hasbin('make'); // cp, make, and rm
    },
    url: [
      selector({
        win32ia32: 'http://downloads.sourceforge.net/project/sevenzip/7-Zip/16.04/7z1604.msi',
        win32x64: 'http://downloads.sourceforge.net/project/sevenzip/7-Zip/16.04/7z1604-x64.msi',
      }),
      selector({
        win32: 'https://github.com/bmatzelle/gow/releases/download/v0.8.0/Gow-0.8.0.exe',
      }),
    ],
    install: selector({
      win32() {
        selector({
          ia32() {
            exec(`start /wait msiexec /a build\\tmp\\7z1604.msi targetdir="${resolve('build/tmp/7-Zip')}" /qn`);
          },
          x64() {
            exec(`start /wait msiexec /a build\\tmp\\7z1604-x64.msi targetdir="${resolve('build/tmp/7-Zip')}" /qn`);
          },
        })();
        exec('build\\tmp\\7-Zip\\Files\\7-Zip\\7z x build/tmp/Gow-0.8.0.exe -obuild/bin/Gow');
      },
      others: false,
    }),
    binDir: 'Gow/bin',
  },
  {
    name: 'JerryScript',
    test() {
      try {
        access('build/jerryscript');
        return true;
      } catch (e) {
        return false;
      }
    },
    url: 'github:jerryscript-project/jerryscript',
    install() {
      copy('build/tmp/jerryscript', 'build/jerryscript');
      exec('pip install -r build/jerryscript/targets/mbedos5/tools/requirements.txt --user'); // testで引っ掛からない
      exec('make getlibs', {cwd: 'build/jerryscript/targets/mbedos5', stdio: 'ignore'});
      outputFile('build/jerryscript/targets/mbedos5/js/flash_leds.js', '');
    },
    binDir: '',
  },
];

module.exports = components;
