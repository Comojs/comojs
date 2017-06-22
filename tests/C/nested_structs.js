var C = require('C');
var assert = require('assert');

var CHILD_STRUCT = C.struct({
	Num  : 'int32',
	Num2 : 'int',
	parent : 'pointer'
});

var PARENT_STRUCT = C.struct({
	Num  : 'int32',
	Buf  : 6,
	Num2 : 'uint8',
	child : CHILD_STRUCT,
	next : 'pointer'
});

var parent = new PARENT_STRUCT();

var child = new CHILD_STRUCT();
child.Num2 = 99;
child.Num = 10;
child.parent = parent;

parent.next = child;
parent.child[0] = 80;

assert.strictEqual(parent.child.Num, 80);

parent.child.Num = 9; // should overwrite 80

assert.strictEqual(parent.child.Num, 9);

parent.child.parent = parent;

parent.Num2 = 1;
parent.Num = 11;

parent.Buf = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'; // no overflow

assert.strictEqual(parent.Num, 11);
assert.strictEqual(parent.Num2, 1);



var parent2 = new PARENT_STRUCT(parent.child.parent);



var child2 = new CHILD_STRUCT(parent2.next);
assert.strictEqual(child2.Num2, 99);
assert.strictEqual(child2.Num, child.Num);


var first_parent = new PARENT_STRUCT((new CHILD_STRUCT(parent.next)).parent);
assert.deepEqual(Buffer(first_parent.Buf), Buffer(parent.Buf));

(function deepStructs () {
	var stru1 = C.struct({
		pad1 : 2,
		struct : C.struct({
			pad1 : 'uint32',
			struct : C.struct({
				pad1 : 'uint32',
				pad2: 'uint32'
			}),
			pad2: 'uint32'
		}),
		pad2 : 'uint32'
	});
	var s = new stru1();
	s.struct.struct.pad2 = 99;

	assert.deepEqual( s.pad1[0], 0 );
	assert.deepEqual( s.pad1[1], 0 );

	assert.deepEqual( s.pad2, 0 );
	assert.deepEqual( s.struct.pad1, 0 );
	assert.deepEqual( s.struct.pad2, 0 );

	assert.deepEqual( s.struct.struct.pad1, 0 );
	assert.deepEqual( s.struct.struct.pad2, 99 );
})();
