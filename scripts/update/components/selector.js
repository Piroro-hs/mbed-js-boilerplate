module.exports = function selector(obj) {
  const has = Set.prototype.has.bind(new Set(Object.keys(obj)));
  const os = process.platform;
  const arch = process.arch;
  const osarch = `${os}${arch}`;
  return has(osarch) ?
    obj[osarch] :
    has(os) ?
      obj[os] :
      has(arch) ?
        obj[arch] :
        has('others') ?
          obj.others :
          '';
};
