const {basename, join} = require('path');

const promisify = require('es6-promisify');

const ftp = promisify(require('ftp-get').get);
const git = promisify(require('download-git-repo'));
const nugget = promisify(require('nugget'));

function downloadFtp(urls, toDir) {
  if (urls.length === 0) {
    return Promise.resolve();
  }
  return Promise.all(urls.map((url) => {
    const name = basename(url);
    console.log(`Downloading ${name}`);
    return ftp(url, join(toDir, name));
  }));
}

function downloadGit(repos, toDir) {
  if (repos.length === 0) {
    return Promise.resolve();
  }
  return Promise.all(repos.map((repo) => {
    const name = repo.split('/')[1];
    console.log(`Downloading ${name}`);
    return git(repo, join(toDir, name));
  }));
}

function downloadHttp(urls, toDir) {
  if (urls.length === 0) {
    return Promise.resolve();
  }
  const opts = {
    dir: toDir,
    resume: true,
    verbose: true,
    strictSSL: false,
    proxy: process.env.PROXY || undefined,
  };
  return nugget(urls, opts);
}

module.exports = function download(from, toDir) {
  const urls = Array.isArray(from) ? from : [from];
  return Promise.all([
    downloadFtp(urls.filter(url => url.startsWith('ftp')), toDir),
    downloadGit(urls.filter(url => url.startsWith('git')), toDir),
    downloadHttp(urls.filter(url => url.startsWith('http')), toDir),
  ]).then(() => {
    console.log(`Downloaded ${urls.filter(url => url !== '').join(', ')} and saved to ${toDir}.`);
  });
};
