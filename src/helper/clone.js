function makeShadow(object, references = { origin: [], shadow: [] }) {
  if (typeof object !== 'object') return object;

  const index = references.origin.indexOf(object);
  if (references.origin.includes(object)) {
    return references.shadow[index];
  }

  const shadow = new object.constructor();

  references.origin.push(object);
  references.shadow.push(shadow);

  Object
  .keys(object)
  .forEach(fieldKey => (shadow[fieldKey] = makeShadow(object[fieldKey], references)));

  return shadow;
}

function makeClone(object, references = { origin: [], clone: [] }) {
  if (typeof object !== 'object') return object;

  const index = references.origin.indexOf(object);
  if (references.origin.includes(object)) {
    return references.clone[index];
  }

  const clone = new object.constructor();

  references.origin.push(object);
  references.clone.push(clone);

  Object.getOwnPropertyNames(object).forEach(fieldKey => {
    const descriptor = Object.getOwnPropertyDescriptor(object, fieldKey);
    descriptor.value = typeof object[fieldKey] === 'object' ? makeClone(descriptor.value, references) : descriptor.value;

    Object.defineProperty(clone, fieldKey, descriptor);
  });

  return clone;
}

module.exports = { makeShadow, makeClone };
