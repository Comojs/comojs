var assert = require('assert');
var sys    = process.binding('syscall');
var struct = require('struct');

var types   = process.binding('types');
var INT_MAX = types.data.INT_MAX;

var testtestStruct = struct.create('testtestStruct', {
	test    : 'int32',
});

var ttt  = new testtestStruct();
ttt.test = 900;

var nb = new Buffer(8);
var testStruct = struct.create({
	testNum    : 'int32',
	testUINT32 : 'uint32',
	p          : ttt,
	buf        :  8, /* bytes */
	p2         : 'testtestStruct',
	pnum       : 4
});

var st  = new testStruct();

for (var i = 0; i < 100; i++){

	st.buf = "hello77\0";
	st.testNum = 9;
	st.p.test  = 10;

	sys.test(st);
	assert.strictEqual(st.testUINT32, INT_MAX + 1);
	assert.strictEqual(st.testNum, INT_MAX);
	// console.log(INT_MAX);
	// console.log(st.buf.toString());
	assert.strictEqual(st.p.test, 10);

	assert.strictEqual(st.p2.test, 99);
	console.log(st.pnum);
}

console.log('done');
