/* eslint import/no-extraneous-dependencies: 0 */
const expect = require('chai').expect;
const { removePrefix, replaceField, assignDeep, getByPath } = require('../../src/helper/helper');

describe('removePrefix', () => {
  it('remove the namespace prefix of object parse from XML', () => {
    const obj = {
      'abc:xyz': {
        'abc:mnp': [{
          a: {},
          'b:c': [],
          'd:f': 1,
        }],
      },
    };

    removePrefix(obj);

    expect(obj).to.deep.equal({ xyz: { mnp: [{ a: {}, c: [], f: 1 }] } });
  });
});

describe('replaceField', () => {
  it('will not do anything to an non-object variable', () => {
    const a = 1000;

    replaceField(a);

    expect(a).to.equal(1000);
  });
  it('replace all field which have the provided key by the provided value', () => {
    const obj = {
      a: {
        b: {
          c: {
            d: 1,
          },
          d: 'abc',
        },
        d: [],
      },
      d: {},
      e: 100,
    };

    replaceField(obj, 'd', 'something special!!!');

    expect(obj).to.deep.equal({
      a: {
        b: {
          c: {
            d: 'something special!!!',
          },
          d: 'something special!!!',
        },
        d: 'something special!!!',
      },
      d: 'something special!!!',
      e: 100,
    });
  });
});

describe('assignDeep', () => {
  it('do not do anything if the destination is non-object variable', () => {
    expect(assignDeep(123, 12345)).to.deep.equal(123);
  });

  it('assign value of an object to another deeply', () => {
    class Abc { }

    const destination = {
      a: { b: { c: 10 } },
    };

    const source = {
      a: { d: 1 },
      b: { a: new Abc() },
      arr: [1, 'abc', { a: 12 }, [2, 3]],
    };

    assignDeep(destination, source);

    expect(destination).to.deep.equal({
      a: { b: { c: 10 }, d: 1 },
      b: { a: {} },
      arr: [1, 'abc', { a: 12 }, [2, 3]],
    });

    expect(destination.b.a instanceof Abc).to.be.equal(true);
  });

  it('assign value of objects to another deeply', () => {
    class Abc { }

    const destination = { a: { b: { c: 10 } } };

    const sources = [{
      a: { d: 1 },
      b: { a: new Abc() },
      arr: [1, 'abc', { a: 12 }, [2, 3]],
    }, {
      a: { e: 12345 },
      123: 'zzzzz',
    }];

    assignDeep(destination, ...sources);

    expect(destination).to.deep.equal({
      a: {
        b: { c: 10 },
        d: 1,
        e: 12345,
      },
      b: { a: {} },
      arr: [1, 'abc', { a: 12 }, [2, 3]],
      123: 'zzzzz',
    });

    expect(destination.b.a instanceof Abc).to.be.equal(true);
  });
});

describe('getByPath', () => {
  const obj = {
    a: { d: 1 },
    b: { a: 1000 },
    arr: [1, 'abc', { a: 12 }, [2, 3]],
    arr1: [{ a: 1 }, { a: 2 }, { a: 3 }],
    arr2: [{ a: { b: [1] } }, { a: { b: [2] } }, { a: { b: [3] } }],
  };
  it('get a value in an object by path', () => {
    expect(getByPath(123, ['x.y.z'])).to.equal(undefined);
    expect(getByPath(obj, ['x.y.z'])).to.equal(undefined);
    expect(getByPath(obj, ['a'])).to.deep.equal({ d: 1 });
    expect(getByPath(obj, 'b.a')).to.equal(1000);
    expect(getByPath(obj, 'arr.2.a', 'obj')).to.equal(12);
    expect(getByPath(obj, ['arr1', getByPath.$INDEX, 'a'])).to.deep.equal([1, 2, 3]);
    expect(getByPath(obj, ['arr2', getByPath.$INDEX, 'a', 'b', '0'])).to.deep.equal([1, 2, 3]);
  });

  describe('falure on', () => {
    it('receive a path which is not a string or Array', () => {
      try {
        getByPath({}, {});
      } catch (e) {
        expect(e.message).to.be.equal('Invalid path: The path of property in object must be an Array or a String');

        return;
      }

      expect('should not be here').to.equal('reached');
    });

    it('try to get in an object as an array, which is not', () => {
      try {
        getByPath(obj, ['a', getByPath.$INDEX, 'a']);
      } catch (e) {
        expect(e.message).to.be.equal('Invalid path: .a is not an Array');

        return;
      }

      expect('should not be here').to.equal('reached');
    });

    it('receive a path which contains an element which is not String or Symbol', () => {
      try {
        getByPath(obj, ['a', {}, 'a']);
      } catch (e) {
        expect(e.message).to.be.equal('Invalid path: The path can contain only string or Symbol to get all');

        return;
      }

      expect('should not be here').to.equal('reached');
    });
  });
});
