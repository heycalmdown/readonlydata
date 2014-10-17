var fs = require('fs');
var crypto = require('crypto');
var ReadOnlyData = require('./lib/readonlydata');

var serializer;
var deserializer;

function require_(jsonFileName) {
	var data = readFile(jsonFileName);
	if (!data.fromcache) {
		data = createFrom(data, jsonFileName);
	}
	return data;
}

function readFile(jsonFileName) {
	var buffer = fs.readFileSync(jsonFileName);
	var sha = crypto.createHash('sha1');
	sha.update(buffer);
	var bufFileHash = sha.digest();
	var bufCacheHash = new Buffer(20);
	var fd;
	try {
		fd = fs.openSync(jsonFileName + '.cache', 'r');
		fs.readSync(fd, bufCacheHash, 0, 20, 0);
	} catch (e) {
	}
	var result;
	if (bufCacheHash.toString() === bufFileHash.toString()) { // cache is valid
		var pos = 20;
		fs.readSync(fd, buffer, 0, 4, pos);
		pos += 4;
		var hintSize = buffer.readUInt32LE(0);
		fs.readSync(fd, buffer, 0, hintSize + 4, pos);
		pos += hintSize + 4;
		var hints = JSON.parse(buffer.slice(0, hintSize));
		var bufferSize = buffer.readUInt32LE(hintSize);
		if (bufferSize > buffer.length) {
			buffer = new Buffer(bufferSize);
		}
		fs.readSync(fd, buffer, 0, bufferSize, pos);

		result = new ReadOnlyData();
		//TODO: using custom serializer with cache
		result.init(Object.keys(hints), null, null);
		result.hints = hints;
		result.buffer = buffer;
		result.cursor = bufferSize;
		result.fromcache = true;
		result.freeze();
	} else {
		result = JSON.parse(buffer);
		Object.defineProperty(result, '__hash', {value: bufFileHash});
		Object.defineProperty(result, '__file', {value: jsonFileName});
	}
	fd && fs.closeSync(fd);
	return result;
}

function writeCache(readOnlyData, bufFileHash, jsonFileName) {
	var hintString = JSON.stringify(readOnlyData.hints);
	var tmpPath = jsonFileName + '.tmp';
	var fd;
	try {
		fd = fs.openSync(tmpPath, 'wx');
	} catch (e) {
		return;
	}
	var pos = 0;
	fs.writeSync(fd, bufFileHash, 0, 20, pos);
	pos += 20;
	var buffer = new Buffer(8 + hintString.length);
	buffer.writeUInt32LE(hintString.length, 0);
	buffer.write(hintString,  4);
	buffer.writeUInt32LE(readOnlyData.buffer.length, hintString.length + 4);
	fs.writeSync(fd, buffer, 0, buffer.length, pos);
	pos += buffer.length;
	fs.writeSync(fd, readOnlyData.buffer, 0, readOnlyData.buffer.length, pos);
	fs.closeSync(fd);
	fs.renameSync(tmpPath, jsonFileName + '.cache');
}

function createFrom(jsonData, jsonFileName) {
	if (jsonFileName) {
		console.time(jsonFileName);
	}
	var keys = Object.keys(jsonData);

	var aReadOnlyData = new ReadOnlyData();
	aReadOnlyData.init(keys, serializer, deserializer);

	var i, len = keys.length;
	for (i = 0; i < len; ++i) {
		aReadOnlyData._insert(keys[i], jsonData[keys[i]]);
	}
	aReadOnlyData.freeze();
	if (jsonFileName) {
		console.timeEnd(jsonFileName);
	}
	if (jsonData.__hash && jsonData.__file && !serializer && !deserializer) {
		writeCache(aReadOnlyData, jsonData.__hash, jsonData.__file);
	}
	jsonData = null;
	keys = null;

	return aReadOnlyData;
}

function overrideSerializer(newSerializer, newDeserializer) {
	if (!newSerializer && !newDeserializer) throw Error('serializer/deserializer both needeed');
	if (serializer || deserializer) throw Error('called twice');
	serializer = newSerializer;
	deserializer = newDeserializer;
}

exports.require = require_;
exports.createFrom = createFrom;
exports.readFile = readFile;
exports.overrideSerializer = overrideSerializer;
exports.ReadOnlyData = ReadOnlyData;
