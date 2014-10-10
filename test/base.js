
var a = {
	1: 1,
	a: 'a',
	b: {
		c: 'c',
		d: 2
	}
};

var fs = require('fs');
var assert = require('assert');
var readonlydata = require('../index');

before(function () {
	fs.writeFileSync('test.json', JSON.stringify(a));
	try {
		fs.unlinkSync('test.json.cache');
	} catch (e) {}
});

describe('nested obejct', function () {
	it('simple', function () {
		var aa = readonlydata.createFrom(a);
		assert(aa[1] === 1);
		assert(aa.a === 'a');
		assert.deepEqual(aa.b, {c: 'c', d: 2});
		assert.deepEqual(Object.keys(aa), [1, 'a', 'b']);
	});
});

describe('cache', function () {
	it('test require', function () {
		var json = readonlydata.require('test.json');
		assert.deepEqual(json, a);
	});
	it('cache should exist', function () {
		assert(fs.existsSync('test.json.cache'));
	});
	it('require again', function () {
		var cached = readonlydata.require('test.json');
		assert(cached.fromcache);
		assert.deepEqual(cached, a);
	});
});

