const {mkdirpSync: mkdirp} = require('fs-extra');

const components = require('./components');
const download = require('./download');

mkdirp('./build/bin');
mkdirp('./build/tmp');

const installNeeded = components.filter(({install, test}) => install && !test());

download(
  installNeeded.filter(({url}) => url).reduce((acc, {url}) => acc.concat(url), []),
  './build/tmp'
).then(() => {
  installNeeded.forEach(({name, install}) => {
    install();
    console.log(`Installed ${name}`);
  });
});
