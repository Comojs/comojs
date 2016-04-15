var C = require('C');
var assert = require('assert');

var UNION = C.union({
	num1 : 'uint32',
	str  : 20,
	num2 : 'uint32',
});

var str = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

var union = new UNION();
union.num1 = 9;
assert.strictEqual(union.num1, 9);
assert.strictEqual(union.num2, 9);

union.num2 = 255;

assert.strictEqual(union.num1, 255);
assert.strictEqual(union.num2, 255);

union.str = str;

assert.strictEqual(Buffer(union).toString(), str.slice(0, 20));


// union in structs

var child = C.Struct.create({
	num1 : 'uint32',
	buf  : 5,
	num2 : 'uint32'
});

var PARENT = C.Struct.create({
	pad : 2,
	unTest : C.union({
		num1 : 'uint32',
		buf  : 20, // largest size
		num2 : 'uint32',
		child : child
	}),
	test : 2
});

var parent = new PARENT();

assert.strictEqual(parent.unTest.byteLength, 20);

parent.unTest.child.num1 = 8;
assert.strictEqual(parent.unTest.child.num1, 8);
assert.strictEqual(parent.unTest.child.num2, 0);

assert.strictEqual(parent.unTest.num1, 8);
assert.strictEqual(parent.unTest.num2, 8);

parent.unTest.buf = str;

assert.strictEqual(Buffer(parent.unTest.buf).toString(), str.slice(0, 20));
assert.strictEqual(Buffer(parent.unTest.child.buf).toString(), str.slice(0, 5));
