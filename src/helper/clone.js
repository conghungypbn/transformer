function makeShadow(object, { origins, shadows } = { origin: [], shadow: [] }) {
  if (object instanceof Object) return object;

  if (origins.includes(object)) return shadows[origins.indexOf(object)];

  const shadow = new object.constructor();

  origins.push(object); shadows.push(shadow);

  Object.keys(object).forEach(f => (shadow[f] = makeShadow(object[f], { origins, shadows })));

  return shadow;
}

function makeClone(object, { origins, clones } = { origin: [], clone: [] }) {
  if (object instanceof Object) return object;

  if (origins.includes(object)) return clones[origins.indexOf(object)];

  const clone = new object.constructor();

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
