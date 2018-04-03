const { makeShadow } = require('./helper/clone');
const { getByPath } = require('./helper/helper');

const isId = v => /^##/.test(v);
const isMappingArray = arr => Array.isArray(arr) && typeof arr[0] === 'object' && arr[0]['**'];

const getDataPaths = (t, path = []) => {
  if (isId(t)) return [Object.assign(path, { key: t })];
  if (isMappingArray(t)) return [Object.assign(path, { key: t[0]['**'] })];
  if (typeof t !== 'object') return [];

  const paths = Object
  .keys(t)
  .reduce((all, key) => all.concat(getDataPaths(t[key], [...path, key])), []);

  return paths;
};

const getData = (fromObj, fromTemplate) => getDataPaths(fromTemplate)
  .reduce((all, path) => Object.assign(all, { [path.key]: getByPath(fromObj, path) }), {});

const translate = (fromObj, toObj, t, parent = undefined, key = undefined) => {
  const data = getData(fromObj, t.from);

  if (isId(toObj)) {
    parent[key] = data[`${toObj}`];
    return toObj;
  }

  // if (typeof toObj !== 'object') return toObj;

  delete toObj.$$; // remove all procId of toObj;

  if (isMappingArray(toObj)) {
    const fromTemplateArray = getData(t.from, t.from);
    const toTemplateArray = getData(t.to, t.to);
    const id = toObj[0]['**'];

    if (!(id in data)) { delete parent[key]; return toObj; }

    const dataArr = data[id];
    const subFromTemplate = fromTemplateArray[id][0];
    const subToTemplate = toTemplateArray[id];

    parent[key] = dataArr.map(subFrom => {
      const subTo = makeShadow(toObj[0]);
      delete subTo['**'];

      return translate(subFrom, subTo, { from: subFromTemplate, to: subToTemplate });
    });

    return toObj;
  }

  Object.keys(toObj).forEach(k => {
    translate(
      fromObj,
      toObj[k],
      { from: t.from, to: toObj[k] },
      toObj,
      k
    );
  });

  return toObj;
};

const invoke = (o, t, processor) => {
  if (!o || !t) return;

  if (Array.isArray(o)) { o.forEach(subObj => invoke(subObj, t[0], processor)); return; }

  Object.keys(o).forEach(k => typeof o[k] === 'object' && t[k] && invoke(o[k], t[k], processor));

  const id = t.$$;
  if (id in processor) processor[id](o);
};

const error = (m) => { throw new Error(m); };
const validateProcessor = t => {
  Object
  .keys(t)
  .forEach(k => (/^@/.test(k) && typeof t[k] === 'function') || error('Invalid processor'));
};

module.exports = class Transformer {
  constructor(template, processor) {
    this.template = template;
    this.processor = processor;

    this._validateProcessor();
  }

  _validateProcessor() {
    validateProcessor(this.processor.pre);
    validateProcessor(this.processor.post);
  }

  transform(from) {
    const t = makeShadow(this.template);
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
