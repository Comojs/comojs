'use strict';

var C = process.binding('C');

C.LE = (function() {
	var buffer = new ArrayBuffer(2);
	new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
	// Int16Array uses the platform's endianness.
	return new Int16Array(buffer)[0] === 256;
})();

var _typesMap = {
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
}


function fieldError(field){
	throw new Error('field ' + field + ' not found');
}


function create_struct_fields(fields){

	var obj = {};
	var buffers = {};
	var structSize = 0;

	for (var key in fields){
		var type = fields[key];
		var size   = type.size;
		var offset = type.offset;
		var set    = type.fn;

		// localize field offset & size
		(function(set, off, size){
			Object.defineProperty(obj, key, {
				get : function(){
					return set(this, off, size);
				},
				set : function(v){
					return set(this, off, size, v);
				}
			});

			Object.defineProperty(buffers, key, {
				get : function(){
					return new DataView(this.buffer, off, size);
				}
			});

		})(set, offset, size);
		structSize += size;
	}

	Object.defineProperty(obj, 'inspect', {
		value : function(){
			var b = new DataView(this);
			b.Length = b.length;
			b.fields = fields;
			return b;
		}
	});

	Object.defineProperty(obj, 'buffer', {
		get : function(){
			buffers.buffer = this;
			return buffers;
		}
	});

	Object.defineProperty(obj, 'pointer', {
		get : function(){
			return C.to_pointer(this);
		}
	});

	obj.size = structSize;
	return obj;
}


function normalize_fields(fields){
	var throwField = function(type){
		throw new Error('unknown field type ' + type);
	};

	var offset = 0;
	Object.keys(fields).forEach(function(name) {
		var type = fields[name];

		// number field value [buffer]
		if (typeof type === 'number'){
			fields[name] = {
				fn     : C.buffer,
				size   : type,
				offset : offset
			};
			offset += fields[name].size;
		}

		// string field type [uint32, int32, int, ...]
		else if (typeof type === 'string'){
			var clone = _typesMap[type];
			if (!clone) throwField(type);
			fields[name] = {
				fn     : clone.fn,
				size   : clone.size,
				offset : offset
			};
			offset += fields[name].size;
		}

		// function field value, passed as another struct
		else if (typeof type === 'function' && type.byteLength){
			var struct = new type();
			fields[name] = {
				fn : function(buf, off, size, v){
					if (typeof v === 'undefined'){
						// C.copy_structs(struct, 0, struct.length, Buffer(buf).slice(off,size));
						C.buffer(struct, Buffer(buf).slice(off,size));
						return struct;
					} else {
						C.buffer(buf, off, size, v);
					}
				},
				size   : type.byteLength,
				offset : offset
			};
			offset += fields[name].size;
		}

		// object, most likely passed by C struct
		else {
			fields[name] = (function(){
				var obj = fields[name];
				obj.fn  = _typesMap[obj.type] ? _typesMap[obj.type].fn : throwField(obj.type);
				delete obj.type;
				return obj;
			})();
		}
	});
	return fields;
}


C.Struct.create = function(obj){
	// if obj passed struct length use it
	var length = obj.length; delete obj.length;
	obj        = normalize_fields(obj);
	var fields = create_struct_fields(obj);
	length     = length || fields.size;
	var structure = function(v){
		var buf = new ArrayBuffer(length);
		if (v) C.buffer(buf, v);
		Object.setPrototypeOf(buf, fields);
		Object.preventExtensions(buf);
		return buf;
	};

	structure.byteLength = length;
	return structure;
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

Object.keys(C.Struct).forEach(function(name) {
	if (name === 'create') return;
	C.Struct[name] = C.Struct.create(C.Struct[name]());
});

module.exports = C;
