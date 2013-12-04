var dynobj = require('dynobj');

var DynObj = new dynobj.DynObj();
var ReadOnlyData = DynObj.create();
ReadOnlyData.prototype.init = function init(keys) {
	Object.defineProperty(this, 'keys', { value: keys });
	Object.defineProperty(this, 'hints', { value: {}, writable: true });
	Object.defineProperty(this, 'buffer', { value: new Buffer(4 * 1024 * 1024), writable: true });
	Object.defineProperty(this, 'cursor', { value: 0, writable: true });
	this.buffer.writeUInt32LE(keys.length, 0);
	this.cursor = 4;
};

ReadOnlyData.prototype.freeze = function freeze() {
	Object.defineProperty(this, 'freeze', { value: true });
	this.cursor = null;
};

ReadOnlyData.prototype.__get__ = function (idx) {
	var cursor = this.hints[idx];
	if (!cursor) return;
	var length = this.buffer.readUInt32LE(cursor);
	var stringified = this.buffer.toString('utf-8', cursor + 4, cursor + 4 + length);
	return JSON.parse(stringified);
};

ReadOnlyData.prototype.__set__ = function () {
	return false;
};

ReadOnlyData.prototype.__enum__ = function () {
	return this.keys;
};

ReadOnlyData.prototype.ensureBufferSize = function ensureBufferSize(size) {
	if (this.buffer.length < size) {
		var newBuffer = new Buffer(this.buffer.length * 2);
		this.buffer.copy(newBuffer);
		this.buffer = newBuffer;
	}
	return this.buffer;
};

ReadOnlyData.prototype._insert = function _insert(key, element) {
	this.hints[key] = this.cursor;
	var stringified = JSON.stringify(element);
	var length = Buffer.byteLength(stringified);
	this.buffer = this.ensureBufferSize(this.cursor + 4 + length);
	this.buffer.writeUInt32LE(length, this.cursor);
	this.cursor += 4;
	this.buffer.write(stringified, this.cursor);
	this.cursor += length;
};

module.exports = ReadOnlyData;

