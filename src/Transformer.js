const { makeShadow } = require('./helper/clone');
const { getByPath } = require('./helper/helper');

const isId = v => /^##/.test(v);
const isMappingArray = arr => Array.isArray(arr) && typeof arr[0] === 'object' && arr[0]['**'];

function getAllDataPathFromTemplate(template, path = []) {
  if (!template) return [];
  if (isId(template)) return [Object.assign(path, { key: template })];
  if (isMappingArray(template)) return [Object.assign(path, { key: template[0]['**'] })];
  if (typeof template !== 'object') return [];

  const paths = Object
  .keys(template)
  .reduce((all, key) => all.concat(getAllDataPathFromTemplate(template[key], [...path, key])), []);

  return paths;
}

function getData(fromObj, fromTemplate) {
  return getAllDataPathFromTemplate(fromTemplate)
    .reduce((all, path) => Object.assign(all, { [path.key]: getByPath(fromObj, path) }), {});
}

function translate(fromObj, toObj, template, parent = undefined, key = undefined) {
  const data = getData(fromObj, template.from);
  if (isId(toObj)) {
    parent[key] = data[`${toObj}`];
    return toObj;
  }

  if (typeof toObj !== 'object') return toObj;

  delete toObj.$$; // remove all procId of toObj;

  const fromTemplateArray = getData(template.from, template.from);
  const toTemplateArray = getData(template.to, template.to);
  if (isMappingArray(toObj)) {
    const id = toObj[0]['**'];
    if (data[id]) {
      const dataArr = data[id];
      const subFromTemplate = fromTemplateArray[id][0];
      const subToTemplate = toTemplateArray[id];
      parent[key] = dataArr.map(subFrom => {
        const subTo = makeShadow(toObj[0]);
        delete subFrom['**'];
        delete subTo['**'];
        delete subFromTemplate['**'];

        return translate(
          subFrom,
          makeShadow(subTo), // a clone
          {
            from: subFromTemplate,
            to: subToTemplate,
          }
        );
      });

      return toObj;
    }
  }

  Object.keys(toObj).forEach(variable => {
    if (toObj[variable] && variable !== undefined) {
      translate(
        fromObj,
        toObj[variable],
        { from: template.from, to: toObj[variable] },
        toObj,
        variable
      );
    }
  });

  return toObj;
}

function proc(object, template, processor) {
  if (!object || !template) return;

  if (Array.isArray(object)) {
    object.forEach(subObject => proc(subObject, template[0], processor));
    return;
  }
  Object.keys(object).forEach(k => {
    if (typeof object[k] === 'object' && template[k]) {
      proc(object[k], template[k], processor);
    }
  });

  const id = template.$$;
  if (processor[id]) processor[id](object);
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

    proc(from, t.from, this.processor.pre);
    translate(from, to, t);
    proc(to, t.to, this.processor.post);

    return to;
  }
};
