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
console.info(aa[1]);
console.info(aa.a);
console.info(aa.b);
console.info(Object.keys(aa));
