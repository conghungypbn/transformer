# README

## Getting Started

This is a javascript module for transforming an object to another based on a couple of template, one for the original and one for the targeted. The approaching came from object in javascript can be treated as a tree for traversing to get data. The mapping can be 1-1, 1-n, n-1 (aggregating via processor)

## Usage

```javascript
const transformer = new Transformer({
  from: {
    id: '##id', // mapping a field use ##{{field_id}} in the template
    $$: '@fgh', // key `$$` is for processor, preprocessor will be invoked before mapping
    a: {
      b: {
        c: '##field1',
      },
    },
    d: [{
      '**': '##array1', // array can be mapped use its first element, id is in field with key `**`
      e: '##arrayField1',
    }],
    '~fgh': '##fgh', // this field is a aggregation, its can be calculated by some preprocessor
  },
  to: {
    $$: '@X', // postprocessor, will be invoked after mapping
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
```
You can have a look in the [test](./tests/Transformer.test.js)
