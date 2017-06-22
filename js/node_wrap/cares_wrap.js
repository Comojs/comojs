var sock  = process.binding('socket');
var C       = require('C');
var syscall = require('syscall');
var assert  = require('assert');
var errno = require('errno');

exports.QueryReqWrap = function(){};
exports.GetAddrInfoReqWrap = function(){};


exports.getaddrinfo = function(req, hostname, family, flags){

	assert(typeof hostname === 'string');
	switch (family) {
		case 0: family = syscall.AF_UNSPEC; break;
		case 4: family = syscall.AF_INET;   break;
		case 6: family = syscall.AF_INET6;  break;
		default: throw new Error ("bad address family");
	}

	var hints = new C.Struct.addrinfo();
	hints.ai_family   = family;
	hints.ai_socktype = syscall.SOCK_STREAM;
	hints.ai_flags    = flags;

	var result = C.void();

	// TODO in thread
	var status = syscall.getaddrinfo(hostname, null /* service */, hints, result);

	var addrs = [];
	if (status === 0){ //success
		var freePTR = result.ptr;
		var info;

		// Iterate over the IPv4
		result = freePTR;
		info   = new C.Struct.addrinfo(result);
		while (result !== null){
			var info = new C.Struct.addrinfo(result);
			result = info.ai_next;
			if (info.ai_family === syscall.AF_INET){
				var addr = new C.Struct.sockaddr(info.ai_addr);
				var ipv4 = sock.ntop(addr.pointer);
				addrs.push(ipv4);
			}
		}

		// Iterate over the IPv6
		result = freePTR;
		info   = new C.Struct.addrinfo(result);
		while (result !== null){
			var info = new C.Struct.addrinfo(result);
			result = info.ai_next;
			if (info.ai_family === syscall.AF_INET6){
				var addr = new C.Struct.sockaddr6(info.ai_addr);
				var ipv6  = sock.ntop(addr.pointer);
				addrs.push(ipv6);
			}
		}

		syscall.freeaddrinfo(freePTR);
	}

	if (status){
		var errname = errno.errname(status);
		switch (errname){
			case 'WSAHOST_NOT_FOUND' : status = 'ENOTFOUND'; break;
			case 'ENOENT' : status = 'ENOTFOUND'; break;
			default : status = 'errno(' + status + ')';
		}
	}
	process.MakeCallback(req, 'oncomplete', status, addrs);
};


exports.queryA = function(req, hostname){
	return exports.getaddrinfo(req, hostname, 4, 0);
};

exports.queryAaaa = function(req, hostname){
	return exports.getaddrinfo(req, hostname, 6, 0);
};

exports.isIP = function(ip){
	return sock.isIP(ip);
};
