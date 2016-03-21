var sock  = process.binding('socket');
var C       = require('C');
var syscall = require('syscall');
var assert  = require('assert');

exports.QueryReqWrap = function(){};
exports.GetAddrInfoReqWrap = function(){};

function IPv4(a1, a2, a3, a4){
	return [a1, a2, a3, a4].join('.');
}
exports.getaddrinfo = function(req, hostname, family, flags){
	assert(typeof hostname === 'string');
	switch (family) {
		case 0: family = sock.AF_UNSPEC; break;
		case 4: family = sock.AF_INET;   break;
		case 6: family = sock.AF_INET6;  break;
		default: throw new Error ("bad address family");
	}

	var hints = new C.Struct.addrinfo();
	hints.ai_family   = family;
	hints.ai_socktype = sock.SOCK_STREAM;
	hints.ai_flags    = flags;

	var result = C.void();

	// TODO in thread
	var status = syscall.getaddrinfo(hostname, null /* service */, hints, result);

	var addrs = [];
	if (status === 0){ //success
		var freePTR = result.ptr;
		result = freePTR;

		var info = new C.Struct.addrinfo(result);
		while (result !== null){
			var info = new C.Struct.addrinfo(result);
			result = info.ai_next;
			switch (info.ai_family){
				case sock.AF_INET : {
					var addr = new C.Struct.sockaddr(info.ai_addr);
					var a    = addr.buffer.sin_addr;
					addrs.push(IPv4(a[0], a[1], a[2], a[3]));
					break;
				}

				case sock.AF_INET6 : {
					var addr = new C.Struct.sockaddr6(info.ai_addr);
					var a    = addr.buffer.sin6_addr;
					console.log(info);
					throw new Error('inet6 : not implemented');
				}

				default : throw new Error('unknown family type');
			}
		}

		syscall.freeaddrinfo(freePTR);
	}

	process.MakeCallback(req, 'oncomplete', status, addrs);
};

exports.isIP = function(ip){
	return sock.isIP(ip);
};
