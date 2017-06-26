var C      = require('C');
var assert = require('assert');

var struct = C.struct({
	Num  : 'int32',
	Buf  : 12,
	Num2 : 'int'
});

var string  = 'coolxxxxxxxt';
var string2 = 'aoolxxxxxxxa';

var t = new struct();
t.Buf = new Buffer(string);

t.Num = -10;
t.Num2 = C.sizeOf.INT_MAX + 100;


assert.strictEqual(Buffer(t.Buf).toString(), string);

t.Buf[0] = 97;
t.Buf[11] = 97;
t.Buf[12] = 97; // overflow ignored

assert.strictEqual(Buffer(t.Buf).toString(), string2);

assert.strictEqual(t.Num2, C.sizeOf.INT_MAX);
assert.strictEqual(t.Num, -10);
