const {access} = require('fs');

function waitP(wait) {
  return new Promise((resolve) => {
    setTimeout(resolve, wait);
  });
}

function waitFor(path, wait = 500, timeout = 1000) {
  return new Promise((resolve, reject) => {
    access(path, (err) => {
      resolve(err ? waitP(wait).then(() => waitFor(path, wait)) : path);
    });
    setTimeout(() => {reject(new Error('timeout'));}, timeout);
  });
}

function waitForSome(pathes, wait = 500, timeout = 1000) {
  return Promise.race(pathes.map(path => waitFor(path, wait, timeout)));
}

module.exports = {waitFor, waitForSome};
