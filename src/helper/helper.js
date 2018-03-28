const removePrefix = (object) => {
  if (typeof object !== 'object') return;

  Object.keys(object).forEach(f => {
    const s = f.split(':');
    const hasPrefix = s.length >= 2;
    if (hasPrefix) {
      object[s[1]] = object[f];
      delete object[f];
      return removePrefix(object[s[1]]);
    }
    return removePrefix(object[f]);
  });
};

const assignDeepOne = (dst, src) => {
  if (typeof dst !== 'object') return src;

  Object.keys(src).forEach(f => {
    if (f !== undefined && f !== null && src[f] !== undefined && typeof src[f] === 'object') {
      if (!dst[f]) dst[f] = new src[f].constructor();

      assignDeepOne(dst[f], src[f]);
    }
  });

  return dst;
};

const assignDeep = (dst, ...srcs) => srcs.forEach(src => assignDeepOne(dst, src));

const replaceField = (object, field, value = null) => {
  if (typeof object !== 'object') return;
  Object.keys(object).forEach(f => {
    if (f === field) object[f] = value;
    else if (typeof object[f] === 'object') replaceField(object[f], field, value);
  });
};

const GET_PROP_OF_ALL_ELEMENTS = Symbol('To get property of all element of Array');
const getByPath = (obj, path = [], currentPath = '') => {
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
};

// getByPath['$INDEX'] = GET_PROP_OF_ALL_ELEMENTS;

// Object.prototype.getByPath = getByPath;

module.exports = { removePrefix, replaceField, assignDeep, getByPath };
