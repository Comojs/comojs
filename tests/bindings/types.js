var assert = require('assert');
var types  = process.binding('C');

var num = 0xFFFFFF;

assert.strictEqual(types.int8(num), -1);
assert.strictEqual(types.int16(num), -1);
assert.strictEqual(types.int32(num), num);

assert.strictEqual(types.uint8(num), 255);
assert.strictEqual(types.uint16(num), 65535);
assert.strictEqual(types.uint32(num), num);

num = -1;
assert.strictEqual(types.int8(num),  -1);
assert.strictEqual(types.int16(num), -1);
assert.strictEqual(types.int32(num), -1);

assert.strictEqual(types.uint8(num), 255);
assert.strictEqual(types.uint16(num), 65535);
assert.strictEqual(types.uint32(num), 4294967295);

num = 2.9;
assert.strictEqual(types.uint8(num), 2);
assert.strictEqual(types.int8(-num), -2);

assert.strictEqual(types.uint16(num), 2);
assert.strictEqual(types.int16(-num), -2);

assert.strictEqual(types.uint32(num), 2);
assert.strictEqual(types.int32(-num), -2);

console.log(types.uint32(num));
