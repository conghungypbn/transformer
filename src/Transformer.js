const { makeShadow } = require('./helper/clone');
const { getByPath } = require('./helper/helper');

const isId = v => /^##/.test(v);
const isMappingArray = arr => Array.isArray(arr) && typeof arr[0] === 'object' && arr[0]['**'];

function getDataPaths(t, path = []) {
  if (!t) return [];
  if (isId(t)) return [Object.assign(path, { key: t })];
  if (isMappingArray(t)) return [Object.assign(path, { key: t[0]['**'] })];
  if (typeof t !== 'object') return [];

  const paths = Object
  .keys(t)
  .reduce((all, key) => all.concat(getDataPaths(t[key], [...path, key])), []);

  return paths;
}

function getData(fromObj, fromTemplate) {
  return getDataPaths(fromTemplate)
  .reduce((all, path) => Object.assign(all, { [path.key]: getByPath(fromObj, path) }), {});
}

function translate(fromObj, toObj, t, parent = undefined, key = undefined) {
  const data = getData(fromObj, t.from);

  if (isId(toObj)) {
    parent[key] = data[`${toObj}`];
    return toObj;
  }

  if (typeof toObj !== 'object') return toObj;

  delete toObj.$$; // remove all procId of toObj;

  if (isMappingArray(toObj)) {
    const fromTemplateArray = getData(t.from, t.from);
    const toTemplateArray = getData(t.to, t.to);
    const id = toObj[0]['**'];

    if (id in data) {
      const dataArr = data[id];
      const subFromTemplate = fromTemplateArray[id][0];
      const subToTemplate = toTemplateArray[id];

      parent[key] = dataArr.map(subFrom => {
        const subTo = makeShadow(toObj[0]);
        delete subFrom['**'];
        delete subTo['**'];
        delete subFromTemplate['**'];

        return translate(subFrom, subTo, { from: subFromTemplate, to: subToTemplate });
      });

      return toObj;
    }
  }

  Object.keys(toObj).forEach(k => {
    if (k in toObj) {
      translate(
        fromObj,
        toObj[k],
        { from: t.from, to: toObj[k] },
        toObj,
        k
      );
    }
  });

  return toObj;
}

function invoke(o, t, processor) {
  if (!o || !t) return;

  if (Array.isArray(o)) { o.forEach(subObj => invoke(subObj, t[0], processor)); return; }

  Object.keys(o).forEach(k => typeof o[k] === 'object' && t[k] && invoke(o[k], t[k], processor));

  const id = t.$$;
  if (id in processor) processor[id](o);
}

module.exports = class Transformer {
  constructor(template, processor) {
    this.template = template;
    this.processor = processor;
  }

  transform(fromOrigin) {
    const t = makeShadow(this.template);
    const from = makeShadow(fromOrigin); // translator changes 'from'
    const to = makeShadow(t.to);

    invoke(from, t.from, this.processor.pre);
    translate(from, to, t);
    invoke(to, t.to, this.processor.post);

    return to;
  }
};


// o: object
// t: template
// k: key
