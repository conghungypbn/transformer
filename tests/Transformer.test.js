/* global describe it */
const chai = require('chai')
const Transformer = require('../src/Transformer')

const expect = chai.expect

const doNothing = {}

describe('Transformer', () => {
  it('can transform an object based on templates', () => {
    const transformer = new Transformer({
      from: {
        $$: '@from',
        id: '##id',
        a: { b: { c: '##field1' } },
        d: [{
          '**': '##array1',
          e: '##arrayField1'
        }],
        '~f': '##field2'
      },
      to: {
        x: '##id',
        y: '##field1',
        z: [{
          '**': '##array1',
          w: '##arrayField1'
        }],
        t: '##field2',
        u: [{ '**': '##nosource' }]
      }
    }, {
      pre: { '@from': o => { o['~f'] = o.f * 2 } },
      post: doNothing
    })

    const newObj = transformer.transform({
      id: '1234567',
      a: { b: { c: 'CongHung' } },
      d: [{ e: 'hahahahaha' }],
      f: 123
    })

    console.log('newObj:', newObj)
    console.log('log', transformer.log)

    expect(newObj).to.deep.equal({
      x: '1234567',
      y: 'CongHung',
      z: [{ w: 'hahahahaha' }],
      t: 123 * 2
    })
  })
  describe('will throw error when', () => {
    it('init with non-function processor', (done) => {
      try {
        const transformer = new Transformer({
          from: {},
          to: { $$: '@to' }
        }, {
          pre: doNothing,
          post: { '@to': '' }
        })
        expect(transformer).to.equal(undefined)
        done(new Error('Unexpected success!'))
      } catch (e) {
        expect(e.message).to.equal('Invalid p')
        done()
      }
    })
  })
})
