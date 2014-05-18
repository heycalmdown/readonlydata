
var a = {
	1: 1,
	a: 'a',
	b: {
		c: 'c',
		d: 2
	}
};

var readonlydata = require('../index');

describe('nested obejct', function () {
	it('simple', function () {
		var aa = readonlydata.createFrom(a);
		var assert = require('assert');
		assert(aa[1] === 1);
		assert(aa.a === 'a');
		assert.deepEqual(aa.b, {c: 'c', d: 2});
		assert.deepEqual(Object.keys(aa), [1, 'a', 'b']);
	});
});
