var binding = process.binding('syscall');
var types   = process.binding('types');
var errno   = require('errno');

var _LoadedLib = {};
var littleEndian = (function() {
	var buffer = new ArrayBuffer(2);
	new DataView(buffer).setInt16(0, 256, true /* littleEndian */);
	return new Int16Array(buffer)[0] === 256; // Int16Array uses the platform's endianness.
})();

var rr     = new Buffer(8);
var retVal = new DataView(rr, 0);

// syscall.LoadLibrary Constructor
// see expoprts.LoadLibrary
function NewLoadLibrary (h){
	this._handle = h;
	this.procs = {};

	// return a function (name) from proc address
	// if errval passed, the return value will check against
	// this errval and if matched the function will return null
	// and set process.errno to the last error
	this.GetProcAddress = function(name, errval){
		var fn = binding.GetProcAddress(h, name);
		if (fn === null){
			throw new Error("unknown proc name " + name);
		}

		//return cached function
		var proc = this.procs[name];
		if (proc) return proc;

		this.procs[name] = function (){
			var args = [].slice.call(arguments);
			args.unshift(retVal);
			args.unshift(fn);
			binding.syscall.apply(null, args);
			var r = retVal.getInt32(0, littleEndian);
			if (typeof errval !== 'undefined'){
				if (r === errval){
					process.errno = exports.GetLastError() || errno.EINVAL;
					return null;
				}
			}
			return r;
		};
		return this.procs[name];
	};
}

// load WINAPI Library
// var lib = syscall.LoadLibrary('kernel32');
// var ReadFile = lib.GetProcAddress('ReadFile');
// ReadFile( ..args.. );
exports.LoadLibrary = function (lib){
	if (_LoadedLib[lib]) {
		return _LoadedLib[lib];
	}

	var handle = binding.LoadLibrary(lib);
	if (handle === null){
		throw new Error("unknown library name " + lib);
	}

	_LoadedLib[lib] = new NewLoadLibrary(handle);
	return _LoadedLib[lib];
};


var platform = process.platform;

if (platform === 'win32'){
	require('syscall/windows')(module);
} else {
	require('syscall/linux')(module);
}
