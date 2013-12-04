var fs = require('fs');
var ReadOnlyData = require('./lib/readonlydata');

function require_(jsonFileName) {
	var rawData = fs.readFileSync(jsonFileName);
	var jsonData = JSON.parse(rawData);
	return createFrom(jsonData, jsonFileName);
}

function createFrom(jsonData, jsonFileName) {
	if (jsonFileName) {
		console.time(jsonFileName);
	}
	var keys = Object.keys(jsonData);

	var aReadOnlyData = new ReadOnlyData();
	aReadOnlyData.init(keys);

	var i, len = keys.length;
	for (i = 0; i < len; ++i) {
		aReadOnlyData._insert(keys[i], jsonData[keys[i]]);
	}
	jsonData = null;
	keys = null;
	aReadOnlyData.freeze();

	if (jsonFileName) {
		console.timeEnd(jsonFileName);
	}
	return aReadOnlyData;
}

exports.require = require_;
exports.createFrom = createFrom;

