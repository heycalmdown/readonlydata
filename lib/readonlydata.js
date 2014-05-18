var ReadOnlyTemplate = require('./readonlytemplate');

function defaultSerializer(element) {
	var stringified = JSON.stringify(element);
	return new Buffer(stringified, 'utf-8');
}

function defaultDeserializer(buffer, cursor, length) {
	var stringified = buffer.toString('utf-8', cursor + 4, cursor + 4 + length);
	return JSON.parse(stringified);
}

var ReadOnlyData = ReadOnlyTemplate.create();
ReadOnlyData.prototype.init = function init(keys, newSerializer, newDeserializer) {
	Object.defineProperty(this, 'serialize', { value: newSerializer || defaultSerializer });
	Object.defineProperty(this, 'deserialize', { value: newDeserializer || defaultDeserializer });
	Object.defineProperty(this, 'keys', { value: keys });
	Object.defineProperty(this, 'hints', { value: {}, writable: true });
	Object.defineProperty(this, 'buffer', { value: new Buffer(4 * 1024 * 1024), writable: true });
	Object.defineProperty(this, 'cursor', { value: 0, writable: true });
	this.buffer.writeUInt32LE(keys.length, 0);
	this.cursor = 4;
};

ReadOnlyData.prototype.freeze = function freeze() {
	Object.defineProperty(this, 'frozen', { value: true });
	this.cursor = null;
};

ReadOnlyData.prototype.__get__ = function (idx) {
	var cursor = this.hints[idx];
	if (!cursor) return;
	var length = this.buffer.readUInt32LE(cursor);
	return this.deserialize(this.buffer, cursor, length);
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
	var serializedBuffer = this.serialize(element);
	var length = serializedBuffer.length;
	this.buffer = this.ensureBufferSize(this.cursor + 4 + length);
	this.buffer.writeUInt32LE(length, this.cursor);
	this.cursor += 4;
	serializedBuffer.copy(this.buffer, this.cursor);
	this.cursor += length;
};

module.exports = ReadOnlyData;

