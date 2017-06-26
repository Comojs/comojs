'use strict';

var C = process.binding('C');

C.LE = (function() {
	var buffer = new ArrayBuffer(2);
	new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
	// Int16Array uses the platform's endianness.
	return new Int16Array(buffer)[0] === 256;
})();

var _typesMap = {
	uint : {
		fn   : C.uint,
		size : C.sizeOf.int
	},
	uint8 : {
		fn   : C.uint8,
		size : C.sizeOf.int8
	},
	uint16 : {
		fn   : C.uint16,
		size : C.sizeOf.int16
	},
	uint32 : {
		fn   : C.uint32,
		size : C.sizeOf.int32
	},
	uint64 : {
		fn   : C.uint64,
		size : C.sizeOf.uint64
	},
	int : {
		fn   : C.int,
		size : C.sizeOf.int
	},
	int8 : {
		fn   : C.int8,
		size : C.sizeOf.int8
	},
	int16 : {
		fn   : C.int16,
		size : C.sizeOf.int16
	},
	int32 : {
		fn   : C.int32,
		size : C.sizeOf.int32
	},
	int64 : {
		fn   : C.int64,
		size : C.sizeOf.int64
	},
	pointer : {
		fn   : C.pointer,
		size : C.sizeOf.uintptr
	},
	'*' : {
		fn   : C.pointer,
		size : C.sizeOf.uintptr
	}
};

function STRUCT (obj, data, off, siz){
	var self = this;
	self.byteLength = 0;
	self.fields = {};

	for (var key in obj){
		var val = obj[key];
		var field = self.fields[key] = { offset : self.byteLength };
		var size = 0;

		if (typeof val === 'number') {
			size = val;
			field.fn = function(buff, offset, size, val){
				var fix = buff.type !== 'struct' ? buff.off : 0;
				if (val){
					C.buffer( buff.buffer, offset + fix, size, val );
				} else {
					return new Uint8Array(buff.buffer, offset + fix, size);
				}
			};
		} else if (typeof val === 'string') {
			var s = _typesMap[val];
			if (!s) throw new Error('unknow struct type ' + val);
			size = s.size;
			field.fn = s.fn;
		} else if (typeof val === 'function' && val.type === 'STRUCT') {
			(function(val){
				var struct = new val();
				size = struct.byteLength;
				field.fn = function(buff, offset, size){
					return new val(buff, offset, size);
				};
			})(val);
		}

		if (typeof val === 'object'){
			if (self.fields.length) {
				self.byteLength = self.fields.length.size;
				delete self.fields.length;
			}

			field.offset = val.offset;
			field.size   = val.size;
			field.fn     = _typesMap[val.type].fn;
		} else {
			self.byteLength += size;
			field.size = size;
		}

		(function(field){
			Object.defineProperty(self, key, {
				get : function(){
					return field.fn(this, field.offset, field.size);
				},
				set : function(val){
					field.fn(this, field.offset, field.size, val);
				}
			});
		})(self.fields[key]);
	}

	Object.defineProperty(self, 'pointer', {
		get : function(){
			return C.to_pointer(this);
		}
	});

	return self;
}

STRUCT.prototype.inspect = function() {
	var b = new Uint8Array(this);
	b.Length = this.byteLength;
	b.fields = this.fields;
	return b;
}

C.struct = function (obj) {
	var st = new STRUCT(obj);
	var fn = function(data, off, size) {
		var buff;
		st.off = 0 || off;
		st.type = 'struct';

		if (data && size){
			buff = new Uint8Array( data.buffer, off + (data.off || 0), size );
		} else {
			buff = new Uint8Array( st.byteLength );
			if (data) C.buffer( buff, data );
		}

		st.buffer = buff.buffer;

		Object.setPrototypeOf(buff, st);
		return buff;
	};
	fn.type = 'STRUCT';
	return fn;
};

C.union = function(obj) {
	var st = new STRUCT(obj);
	var fn = function(data, off, size) {
		st.off = 0 || off;
		var maxSize = 0;
		for (var key in st.fields){
			st.fields[key].offset = 0;
			if (st.fields[key].size > maxSize) {
				maxSize = st.fields[key].size;
			}
		}

		st.byteLength = maxSize;

		var buff;
		if (data && size){
			if (size > maxSize) throw('max size');
			buff = new Uint8Array( data.buffer, off + (data.off || 0), size);
		} else {
			buff = new Uint8Array( maxSize );
			if (data) C.buffer( buff, data );
		}

		st.buffer = buff.buffer;
		Object.setPrototypeOf(buff, st);
		return buff;
	};
	fn.type = 'STRUCT';
	return fn;
};

var voidValues = {};
Object.defineProperty(voidValues, 'ptr', {
	get : function(){
		return C.pointer(this);
	}
});

Object.defineProperty(voidValues, 'int', {
	get : function(){
		return C.int(this, 0);
	},
	set : function(v){
		C.int(this, 0, 0, v);
	}
});

Object.defineProperty(voidValues, 'int32', {
	get : function(){
		return C.int32(this, 0);
	},
	set : function(v){
		C.int32(this, 0, 0, v);
	}
});

Object.defineProperty(voidValues, 'uint32', {
	get : function(){
		return C.uint32(this, 0);
	},
	set : function(v){
		C.uint32(this, 0, 0, v);
	}
});

C.void = function(n){
	var buf = new ArrayBuffer(n || C.sizeOf.intptr);
	Object.setPrototypeOf(buf, voidValues);
	return buf;
}

var Struct = {};
Object.keys(C.Struct).forEach(function(name) {
	if (name === 'create') return;
	Struct[name] = C.struct(C.Struct[name]());
});

C.Struct = Struct;

module.exports = C;
