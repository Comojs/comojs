var binding = process.binding('syscall');
var errno   = require('errno');
var C       = require('C');
var sock    = require('socket');
var syscall = exports;

{	// shared constants
	syscall.AF_UNSPEC   = sock.AF_UNSPEC;
	syscall.SOCK_STREAM = sock.SOCK_STREAM;
	syscall.IPPROTO_IP  = sock.IPPROTO_IP;
	syscall.AF_INET     = sock.AF_INET;
	syscall.AF_INET6    = sock.AF_INET6;
}

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
					process.errno = syscall.GetLastError() || errno.EINVAL;
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
//===========================================================
  syscall.LoadLibrary = function (lib){
//===========================================================
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


function IPv4(a1, a2, a3, a4){
	return [a1, a2, a3, a4].join(':');
}

//===========================================================
  syscall.LookupIP = function(name) {
//===========================================================
	var hints = new C.Struct.addrinfo();

	//set hints
	hints.ai_family   = syscall.AF_UNSPEC;
	hints.ai_socktype = syscall.SOCK_STREAM;
	hints.ai_protocol = syscall.IPPROTO_IP;

	var result = C.void();
	// name = UTF16PtrFromString(name);

	var e = syscall.getaddrinfo(name, null, hints, result);
	if (e !== 0){
		throw new Error(e);
	}

	// if e != nil {
	// 	return nil, &DNSError{Err: os.NewSyscallError("getaddrinfow", e).Error(), Name: name}
	// }

	// get pointer address stored in result buffer
	var freePTR = result.ptr;
	result = freePTR;
	var addrs = [];

	var info = new C.Struct.addrinfo(result);
	while (result !== null){
		var info = new C.Struct.addrinfo(result);
		result = info.ai_next;
		switch (info.ai_family){
			case syscall.AF_INET : {
				var addr = new C.Struct.sockaddr(info.ai_addr);
				var a    = addr.buffer.sin_addr;
				addrs.push(IPv4(a[0], a[1], a[2], a[3]));
				break;
			}

			case syscall.AF_INET6 : {
				console.log(info);
				var addr = new C.Struct.sockaddr6(info.ai_addr);
				var a    = addr.Buffer('sin6_addr');
				console.log(a);
				throw new Error('inet6 : not implemented');
			}

			default : throw new Error('unknown family type');
		}
	}

	syscall.freeaddrinfo(freePTR);
	return addrs;
};
