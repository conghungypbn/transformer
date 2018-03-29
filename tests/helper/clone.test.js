/* eslint import/no-extraneous-dependencies: 0 */
const expect = require('chai').expect;
const { makeShadow, makeClone } = require('../../src/helper/clone');

describe('makeShadow/makeClone', () => {
  const originalObject = {
    a: 123,
    b: [1, 2, 'string', [1, 2], { c: { d: 1 } }],
  };

  [makeShadow, makeClone].forEach(f => {
    it('return the value (non-object variable)', () => {
      expect(f(1000)).to.equal(1000);
    });

    it(`${f.name} can make a shadow of an object`, () => {
      const shadow = f(originalObject);

      expect(shadow).to.deep.equal(originalObject);
      expect(shadow.toString()).to.equal(originalObject.toString());
    });

    describe('When we have an  circular object', () => {
      it(`${f.name} can make a shadow of the circular Object`, () => {
        const obj = { a: { c: 10 } };
        obj.a.d = obj;

        const clone = f(obj);

        expect(clone).to.have.property('a');
        expect(clone.a.c).to.equal(10);
        expect(clone.a.d === clone).to.equal(true);
        expect(clone).to.deep.equal(obj);
      });
    });
  });
});

describe('makeClone', () => {
  describe(`copy object's attributes (isExtensible, isSealed, isFrozen)`, () => {
    it('can be not extensible', () => {
      const obj = {};
      Object.preventExtensions(obj);
      const clone = makeClone(obj);

      expect(Object.isExtensible(clone)).to.equal(false);
    });

    it('can be sealed', () => {
      const obj = {};
      Object.seal(obj);
      const clone = makeClone(obj);

      expect(Object.isSealed(clone)).to.equal(true);
    });


    it('can be frozen', () => {
      const obj = {};
      Object.freeze(obj);
      const clone = makeClone(obj);

      expect(Object.isFrozen(clone)).to.equal(true);
    });
  });

  describe(`copy attributes of the object's properties`, () => {
    it('property is not configurable', () => {
      const obj = {};
      Object.defineProperty(obj, 'something', {
        configurable: false,
        value: 10,
      });

      const clone = makeClone(obj);

      let changed = false;
      try {
        Object.defineProperty(clone, 'something', {
          configurable: true,
        });
        changed = true;
      } catch (e) {
        expect(e.message).to.equal('Cannot redefine property: something');
      }

      expect(changed).to.equal(false);
    });

    it('property is not writable', () => {
      const obj = {};
      Object.defineProperty(obj, 'something', {
        writable: false,
        value: 123456789,
      });

      const clone = makeClone(obj);

      expect(clone.something).to.equal(123456789);
      expect(Object.getOwnPropertyDescriptor(clone, 'something').writable).to.equal(false);
      clone.something = 1;
      expect(clone.something).to.equal(123456789);
    });

    it('property is not enumerable', () => {
      const obj = {};
      Object.defineProperty(obj, 'something', {
        enumerable: false,
        value: 123456789,
      });

      const clone = makeClone(obj);

      expect(clone.something).to.equal(123456789);

      expect(Object.keys(clone).includes('something')).to.equal(false);
      expect(Object.getOwnPropertyNames(clone).includes('something')).to.equal(true);
    });
  });

  describe('When we have an class and an instance of it', () => {
    class Abc {
      method1() { return 'method1'; }
    }

    const a = new Abc();

    it('can make a clone which has same constructor so it inherit the methods', () => {
      const a1 = makeClone(a);
      expect(a1).to.deep.equal(a);

      expect(a1.method1).to.equal(a.method1);
      expect(a1.method1()).to.equal(a.method1());
    });

    it('can mimic the behavior of getter', () => {
      Object.defineProperty(a, 'something', {
        get() { return this._a; },
        set(newValue) { this._a = newValue; },
      });
      const a1 = makeClone(a);

      a1.something = 123456789;

      /* eslint "no-underscore-dangle": 0 */
      expect(a1._a).to.equal(123456789);
      expect(a1._a).to.equal(a1.something);
    });
  });

  // describe('When we have a Proxy instance', () => {
  //   const obj = {};
  //   const proxy = new Proxy();
  // });
});
