/**
 * removePrefix - remove the prefix in each field of XML response
 *
 * @param  {object} object The object to be processed
 * @return {undefined}        undefined
 */
function removePrefix(object) {
  if (typeof object !== 'object') {
    return;
  }

  Object.keys(object).forEach(f => {
    if (f !== undefined && f !== null) {
      const s = f.split(':');
      if (s.length >= 2) {
        object[s[1]] = object[f];
        object[f] = undefined;
        removePrefix(object[s[1]]);
      } else {
        removePrefix(object[f]);
      }
    }
  });
}

/**
 * makeClone - Make a clone of an object
 *
 * @param  {object} object the object
 * @return {object}        the clone
 */
function makeClone(object) {
  if (typeof object !== 'object') {
    return object;
  }

  const clone = new object.constructor();
  Object.keys(object).forEach(f => {
    if (f !== undefined && f !== null) {
      if (object[f] !== undefined) {
        if (typeof object[f] === 'object') {
          clone[f] = makeClone(object[f]);
        } else {
          clone[f] = object[f];
        }
      }
    }
  });

  return clone;
}

/**
 * assignDeepOne - Assign all leaf node of object to another object
 *
 * @param  {object} dst the object receive nodes
 * @param  {object} src the source object
 * @return {object}     Destination object
 */
function assignDeepOne(dst, src) {
  if (typeof dst !== 'object') {
    dst = src;
    return dst;
  }
  Object.keys(src).forEach(f => {
    if (f !== undefined && f !== null && src[f] !== undefined) {
      if (typeof src[f] === 'object') {
        if (!dst[f]) {
          dst[f] = new src[f].constructor();
        }
        assignDeepOne(dst[f], src[f]);
      }
    }
  });

  return dst;
}

/**
 * assignDeep - Assign deep with multiple source
 *
 * @param  {object} dst     Destination
 * @param  {object} srcs Sources
 * @return {object}         Destination
 */
function assignDeep(dst, ...srcs) {
  srcs.forEach(src => assignDeepOne(dst, src));
}

/**
 * replaceField - replace all field which is a node in a object tree which has its key is field
 *
 * @param  {type} object       the processed object
 * @param  {type} field        the key of the field
 * @param  {type} value = null the new value for replaced field
 * @return {undefined}              undefined
 */
function replaceField(object, field, value = null) {
  if (typeof object !== 'object') return;
  Object.keys(object).forEach(f => {
    if (f !== undefined && f !== null) {
      if (f === field) object[f] = value;
      else if (typeof object[f] === 'object') {
        replaceField(object[f], field, value);
      }
    }
  });
}

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

// getByPath['$INDEX'] = GET_PROP_OF_ALL_ELEMENTS;

// Object.prototype.getByPath = getByPath;

module.exports = { removePrefix, makeClone, replaceField, assignDeep, getByPath };
