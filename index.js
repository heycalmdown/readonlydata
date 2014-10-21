var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var ReadOnlyData = require('./lib/readonlydata');

var serializer;
var deserializer;
var cacheDirPath;

function require_(jsonFileName) {
	var data = readFile(jsonFileName);
	if (!data.fromcache) {
		data = createFrom(data, jsonFileName);
	}
	return data;
}

function getCachePath(srcPath, hashString) {
	srcPath += '.' + hashString;
	return cacheDirPath ? path.join(cacheDirPath, path.basename(srcPath)) : srcPath;
}

function readFile(jsonFileName) {
	var buffer = fs.readFileSync(jsonFileName);
	var sha = crypto.createHash('sha1');
	sha.update(buffer);
	var hashString = sha.digest('hex');
	var bufCacheHash = new Buffer(20);
	var fd;
	try {
		fd = fs.openSync(getCachePath(jsonFileName, hashString), 'r');
		fs.readSync(fd, bufCacheHash, 0, 20, 0);
	} catch (e) {
	}
	var result;
	if (bufCacheHash.toString('hex') === hashString) { // cache is valid
		var pos = 20;
		pos += fs.readSync(fd, buffer, 0, 4, pos);
		var hintSize = buffer.readUInt32LE(0);
		pos += fs.readSync(fd, buffer, 0, hintSize + 4, pos);
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
	}
	Object.defineProperty(result, '__hash', {value: hashString});
	Object.defineProperty(result, '__file', {value: jsonFileName});
	fd && fs.closeSync(fd);
	return result;
}

function writeCache(readOnlyData, hashString, jsonFileName) {
	var hintString = JSON.stringify(readOnlyData.hints);
	var cachePath = getCachePath(jsonFileName, hashString);
	var tmpPath = cachePath + '.tmp';
	var fd;
	try {
		fd = fs.openSync(tmpPath, 'wx');
	} catch (e) {
		return;
	}
	var pos = 0;
	pos += fs.writeSync(fd, new Buffer(hashString, 'hex'), 0, 20, pos);
	var buffer = new Buffer(8 + hintString.length);
	buffer.writeUInt32LE(hintString.length, 0);
	buffer.write(hintString,  4);
	buffer.writeUInt32LE(readOnlyData.buffer.length, hintString.length + 4);
	pos += fs.writeSync(fd, buffer, 0, buffer.length, pos);
	fs.writeSync(fd, readOnlyData.buffer, 0, readOnlyData.buffer.length, pos);
	fs.closeSync(fd);
	fs.renameSync(tmpPath, cachePath);
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
		Object.defineProperty(aReadOnlyData, '__hash', {value: jsonData.__hash});
		Object.defineProperty(aReadOnlyData, '__file', {value: jsonData.__file});
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

function setCacheDirPath(dirPath) {
	if (!fs.existsSync(dirPath)) throw new Error('invalid path: ' + dirPath);
	cacheDirPath = dirPath;
}

exports.require = require_;
exports.createFrom = createFrom;
exports.readFile = readFile;
exports.overrideSerializer = overrideSerializer;
exports.setCacheDirPath = setCacheDirPath;
exports.ReadOnlyData = ReadOnlyData;
