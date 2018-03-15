function makeShadow(object, { origins, shadows } = { origins: [], shadows: [] }) {
  if (typeof object !== 'object') return object;

  if (origins.includes(object)) return shadows[origins.indexOf(object)];

  const shadow = new object.constructor();

  origins.push(object); shadows.push(shadow);

  Object.keys(object).forEach(f => (shadow[f] = makeShadow(object[f], { origins, shadows })));

  return shadow;
}

function makeClone(object, { origins, clones } = { origins: [], clones: [] }) {
  if (typeof object !== 'object') return object;

  if (origins.includes(object)) return clones[origins.indexOf(object)];

  const clone = new object.constructor();

  if (!Object.isExtensible(object)) Object.preventExtensions(clone);
  if (Object.isSealed(object)) Object.seal(clone);
  if (Object.isFrozen(object)) Object.freeze(clone);

  origins.push(object); clones.push(clone);

  Object.getOwnPropertyNames(object).forEach(f => {
    const descriptor = Object.getOwnPropertyDescriptor(object, f);
    if ('value' in descriptor) {
      descriptor.value = typeof object[f] === 'object'
      ? makeClone(descriptor.value, { origins, clones })
      : descriptor.value;
    } // only need to do this if the property is not a getter/setter.

    Object.defineProperty(clone, f, descriptor);
  });

  return clone;
}

module.exports = { makeShadow, makeClone };
