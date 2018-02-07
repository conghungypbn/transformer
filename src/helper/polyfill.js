const GET_PROP_OF_ALL_ELEMENTS = Symbol('To get property of all element of Array');

function getByPath(obj, path = [], currentPath = '') {
  if (typeof path === 'string') path = path.split('.');
  if (!Array.isArray(path)) throw new Error('Invalid path: The path of property in object must be an Array or a String');
  if (path.length === 0) return obj;
  if (typeof obj !== 'object') return undefined;

  const subPath = path.shift();
  if (subPath === GET_PROP_OF_ALL_ELEMENTS) {
    if (!Array.isArray(obj)) throw new Error(`Invalid path: ${currentPath} is not an Array`);

    return obj.map((e, i) => getByPath(e, path.join('.'), `${currentPath}.[${i}]`));
  }

  if (typeof subPath !== 'string') throw new Error('Invalid path: The path can contain only string or Symbol to get all');

  return getByPath(obj[subPath], path, `${currentPath}.${subPath}`);
}

getByPath.$INDEX = GET_PROP_OF_ALL_ELEMENTS;

Object.defineProperty(Object.prototype, 'getByPath', {
  value(path) { return getByPath(this, path); },
  writable: false,
  enumarable: false,
  configurable: false,
});
