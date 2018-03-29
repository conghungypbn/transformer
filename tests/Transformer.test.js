/* eslint import/no-extraneous-dependencies: 0 */
const expect = require('chai').expect;
const Transformer = require('../src/Transformer');

const doNothing = () => { };
describe('Transformer', () => {
  it('can transform an object based on templates', () => {
    const transformer = new Transformer({
      from: {
        id: '##id',
        a: {
          b: {
            c: '##field1',
          },
        },
        d: [{
          '**': '##array1',
          e: '##arrayField1',
        }],
      },
      to: {
        x: '##id',
        y: '##field1',
        z: [{
          '**': '##array1',
          w: '##arrayField1',
        }],
      },
    }, {
      pre: doNothing,
      post: doNothing,
    });

    const newObj = transformer.transform({
      id: '1234567',
      a: { b: { c: 'CongHung' } },
      d: [{ e: 'hahahahaha' }],
    });

    expect(newObj).to.deep.equal({
      x: '1234567',
      y: 'CongHung',
      z: [{ w: 'hahahahaha' }],
    });
  });
});
