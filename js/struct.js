'use strict';
// =======================================================================
//	struct = require('struct');
//	struct.create({
//		name : 'string',
//		id   : 'int32'
//	});
//
//	var st = new struct();
//	st.name = "joe";
//	st.id = 1;
//=========================================================================

module.exports = structs;

var binding    = process.binding('buffer');
var syscall    = process.binding('syscall');
var sizeOf     = exports.data = process.binding('C').sizeOf;

var namedStructs = {};

var LE = (function() {
	var buffer = new ArrayBuffer(2);
	new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
	return new Int16Array(buffer)[0] === 256; // Int16Array uses the platform's endianness.
})();


// a map that return setters and getter functions
// for each data type
var structSettersGetters = {
	'int8' : {
		get : function(offset, length){
			return this.view.getInt8(offset, LE);
		},

		set : function(offset, length, newVal){
			this.view.setInt8(offset, newVal, LE);
		}
	},

	'uint8' : {
		get : function(offset, length){
			return this.view.getUint8(offset, LE);
		},

		set : function(offset, length, newVal){
			this.view.setUint8(offset, newVal, LE);
		}
	},

	'int16' : {
		get : function(offset, length){
			return this.view.getInt16(offset, LE);
		},

		set : function(offset, length, newVal){
			this.view.setInt16(offset, newVal, LE);
		}
	},

	'uint16' : {
		get : function(offset){
			return this.view.getUint16(offset, LE);
		},

		set : function(offset, length, newVal){
			this.view.setUint16(offset, newVal, LE);
		}
	},

	'int32' : {
		get : function(offset, length){
			return this.view.getInt32(offset, LE);
		},

		set : function(offset, length, newVal){
			this.view.setInt32(offset, newVal, LE);
		}
	},

	'uint32' : {
		get : function(offset){
			return this.view.getUint32(offset, LE);
		},

		set : function(offset, length, newVal){
			this.view.setUint32(offset, newVal, LE);
		}
	},

	'int64' : {
		get : function(offset){
			return this.view.getUint32(offset, LE);
		},

		set : function(offset, length, newVal){
			this.view.setUint32(offset, newVal, LE);
		}
	},

	'uint64' : {
		get : function(offset){
			return this.view.getUint32(offset, LE);
		},

		set : function(offset, length, newVal){
			this.view.setUint32(offset, newVal, LE);
		}
	},

	'uintptr' : {
		get : function(offset){
			return this.view.getUint32(offset, LE);
		},

		set : function(offset, length, newVal){
			this.view.setUint32(offset, newVal, LE);
		}
	},

	'Buffer' : {
		get : function(offset, length){
			return new Buffer(this.buffer).slice(offset, offset+length);
		},

		set : function(offset, length, newVal){
			binding.utf8Write.call(this.buffer, newVal, offset, length);
		}
	},

	'Pointer' : {
		get : function(offset, length, obj){
			return obj;
		},

		set : function(offset, length, newVal){
			syscall.pointerToBuffer(this.buffer, newVal.buffer, offset);
		}
	},

	'Struct' : {
		get : function(offset, length, obj){
			for (var i = 0; i < length; i++){
				obj.buffer[i] = this.buffer[offset++];
			}
			return obj;
		},

		set : function(offset, length, obj, newVal){
			throw new Error("cant't set values");
		}
	},

	'*' : {
		get : function(offset, length, obj){

		},

		set : function(offset, length, obj, newVal){

		}
	}
}

// Struct internal constructor object
// you need to use struct.create
function Struct(obj){

	var buffer;
	this.size = 0;
	var constructPointer = [];

	for (var key in obj){
		var offset = this.size;

		var val = obj[key];
		var length = null;
		var type;

		// we can pass a pointer to another struct
		if (val instanceof Struct){
			length = sizeOf.uintptr;
			type   = 'Pointer';
			constructPointer.push([key, val]);
		}

		// when passing a number we mean
		// a buffer to be allocated
		else if (typeof val === 'number'){
			length = val;
			type = 'Buffer';
		}

		else if (val === '*'){
			length = sizeOf.intptr;
			type = 'Buffer';
		}

		else if (val instanceof Buffer){
			length = val.byteLength;
			type = 'Buffer';
		}

		// string or null
		else {
			if (val === null) val = 'NULL';

			length = sizeOf[val];

			if (typeof length !== 'undefined'){
				type = val;
			} else {
				var str = namedStructs[val];

				//nothing match this struct field!
				if (!str) throw new Error("unknown struct type " + val);

				type   = 'Struct';
				val    = new str();
				length = val.size;
				// val.buffer = Buffer(8);
				//after constructing our buffer we need to point
				//to this new created struct,
				// constructPointer.push([key, val]);
			}

			// else {
			// 	var str = namedStructs[val];
			// 	if (!str){
			// 		throw new Error("unknown struct type " + val);
			// 	}

			// 	type   = 'Pointer';
			// 	val    = new str();
			// 	length = 4;
			// 	// val.buffer = Buffer(8);
			// 	//after constructing our buffer we need to point
			// 	//to this new created struct,
			// 	constructPointer.push([key, val]);
			// }
		}

		this.size += length;

		if (type === 'Struct'){
			Object.defineProperty(this, key, {
				get: structSettersGetters[type].get.bind(this, offset, length, val),
				set: structSettersGetters[type].set.bind(this, offset, length, val),
				enumerable: true,
				configurable: true
			});
		}else {
			if (!structSettersGetters[type]){
				throw new Error("unknown struct type " + type);
			}

			Object.defineProperty(this, key, {
				get: structSettersGetters[type].get.bind(this, offset, length, val),
				set: structSettersGetters[type].set.bind(this, offset, length),
				enumerable: true,
				configurable: true
			});
		}
	}

	this.buffer = new Uint8Array(this.size);
	this.view   = new DataView(this.buffer);
	this.reset  = function(){
		this.buffer.fill('\0');
	};

	for (var i = 0; i < constructPointer.length; i++){
		var str = constructPointer[i];
		//will be handled by structSettersGetters.Pointer.set
		this[str[0]] = str[1];
	}

	Object.setPrototypeOf(this.buffer, this);
	return this.buffer;
}

// struct.create
// create a c like struct from javascript
// supported data types can be viewd with struct.data and
// an instace/name of another struct
function structs(name){
	if (!namedStructs[name]){
		throw new Error('unknown struct name ' + name);
	}
	return namedStructs[name];
};

structs.create = function (name, obj){

	//name is optionsal
	if (typeof name !== 'string'){
		obj = name;
		name = undefined;
	}

	var struct;
	var st = function NewStruct(buf){
		if (this instanceof NewStruct){
			return new Struct(obj, buf);
		}

		if (!struct){
			struct = new Struct(obj, buf);
		}
		return struct;
	};

	if (name) namedStructs[name] = st;
	return st;
};


function TypeStruct (s){
	this.view = new DataView(s);
	this.size = function(){
		return this.view.byteLength;
	};
}


structs.uint32 = function(n){
	n = n || 1;
	var s = new Uint32Array(n);
	var t = new TypeStruct(s);
	t.get = function(){ return this.view.getUint32(0, LE) };
	t.set = function(v){ return this.view.setUint32(0, v, LE) };
	Object.setPrototypeOf(s, t);
	return s;
};


structs.int32 = function(n){
	n = n || 1;
	var s = new Int32Array(n);
	var t = new TypeStruct(s);
	t.get = function(){ return this.view.getInt32(0, LE) };
	t.set = function(v){ return this.view.setInt32(0, v, LE) };
	Object.setPrototypeOf(s, t);
	return s;
};

if (sizeOf.int === 2){
	structs.int = function(n){
		n = n || 1;
		var s = new Int32Array(n);
		var t = new TypeStruct(s);
		t.get = function(n){ n = n || 0; return this.view.getInt16(n * 2, LE) };
		t.set = function(v, n){ n = n || 0; return this.view.setInt16(n * 2, v, LE) };
		Object.setPrototypeOf(s, t);
		return s;
	};
} else {
	structs.int = function(n){
		n = n || 1;
		var s = new Int32Array(n);
		var t = new TypeStruct(s);
		t.get = function(n){ n = n || 0; return this.view.getInt32(n * 4, LE) };
		t.set = function(v, n){ n = n || 0; return this.view.setInt32(n * 4, v, LE) };
		Object.setPrototypeOf(s, t);
		return s;
	};
}

module.exports = structs;
