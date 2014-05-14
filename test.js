var a = {
	1: 1,
	a: 'a',
	b: {
		c: 'c',
		d: 2
	}
};

var readonlydata = require('./index');
var aa = readonlydata.createFrom(a);
var assert = require('assert');
console.info(aa[1]);
console.info(aa.a);
console.info(aa.b);
console.info(Object.keys(aa));
assert(aa[1] === 1);
assert(aa.a === 'a');
assert.deepEqual(aa.b, {c: 'c', d: 2});
assert.deepEqual(Object.keys(aa), [1, 'a', 'b']);
