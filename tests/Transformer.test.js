/* eslint import/no-extraneous-dependencies: 0 */
const expect = require('chai').expect;
const Transformer = require('../src/Transformer');

describe('Transformer', () => {
  it('can transform an object based on templates, and do it continuosly', () => {
    const transformer = new Transformer({
      from: {
        id: '##id',
        $$: '@fgh',
        a: {
          b: {
            c: '##field1',
          },
        },
        d: [{
          '**': '##array1',
          e: '##arrayField1',
        }],
        '~fgh': '##fgh',
      },
      to: {
        $$: '@X',
        x: '##id',
        y: '##field1',
        z: [{
          '**': '##array1',
          w: '##arrayField1',
        }],
        i: [{ '**': '##nomatch' }],
        fghTotal: '##fgh',
      },
    }, {
      pre: {
        '@fgh': o => (o['~fgh'] = (o.f || 0) + (o.g || 0) + (o.h || 0)),
      },
      post: {
        '@X': o => o.x || delete o.x,
      },
    });

    const newObj = transformer.transform({
      id: '1234567',
      a: { b: { c: 'CongHung' } },
      d: [{ e: 'hahahahaha' }, { e: 'hohohohohoho' }, { e: 'hihihihihi' }],
      f: 100,
      g: 200,
      h: 300,
    });

    expect(newObj).to.deep.equal({
      x: '1234567',
      y: 'CongHung',
      z: [{ w: 'hahahahaha' }, { w: 'hohohohohoho' }, { w: 'hihihihihi' }],
      fghTotal: 600,
    });

    const newObj2 = transformer.transform({
      id: null,
      a: { b: { c: 'XYZ' } },
      d: [{ e: 'huhuhhuhuhuhuhu' }],
    });

    expect('x' in newObj2).to.equal(false);
    expect(newObj2).to.deep.equal({
      y: 'XYZ',
      z: [{ w: 'huhuhhuhuhuhuhu' }],
      fghTotal: 0,
    });
  });

  it('can even make things out of nothing', () => {
    const transformer = new Transformer({
      to: { $$: '@optimus_prime' },
    }, {
      pre: {},
      post: {
        '@optimus_prime': o => (o.name = 'Optimus Prime'),
      },
    });

    const optimus = transformer.transform({});

    expect(optimus.name).to.equal('Optimus Prime');
  });

  it('throw error with invalid processor', (done) => {
    try {
      const transformer = new Transformer({}, {
        pre: {
          $$: 'abc',
        },
        post: {},
      });
      expect(transformer).to.equal('nothing');
      return done('failed');
    } catch (e) {
      expect(e.message).to.equal('Invalid processor');
      return done();
    }
  });
});
