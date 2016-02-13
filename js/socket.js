"use strict";

var socket = process.binding('socket');

var SOCK_STREAM = socket.SOCK_STREAM;
var AF_INET     = socket.AF_INET;

socket.ipAddress = socket.pton;

Object.defineProperty(socket, 'hasIPv6', {
	get : function (){
		if (typeof this.IPV6 !== 'undefined')
			return this.IPV6;

		var s = this.socket(this.AF_INET6, this.SOCK_STREAM, 0);
		if (s === null){
			this.IPV6 = false;
		} else {
			this.IPV6 = true;
			this.close(s);
		}

		return this.IPV6;
	}
});


socket.winsocketpair = function(n){
	return socket.socketpair(n);

	var proto = socket.getprotobyname('tcp');
	// for (1..5) {
	// 	carp "winsocketpair failed: $!, retrying" unless $_ == 1;
	var port = 5000;
	while (1){
		var listener = socket.socket(socket.AF_INET, socket.SOCK_STREAM, proto );
		var server = socket.socket(socket.AF_INET, socket.SOCK_STREAM, proto );
		var client = socket.socket(socket.AF_INET, socket.SOCK_STREAM, proto );

		socket.nonblock(client, 0);

		var addr = socket.pton4(socket.INADDR_LOOPBACK, port++);

		if (socket.bind( listener, addr ) === null){
			if (process.errno === 10048 || process.errno === 98){
				continue;
			}
			throw new Error("bind error " + process.errno);
		}

		if (socket.listen( listener, 1 ) === null){
			throw new Error("listen error " + process.errno);
		}

		addr = socket.getsockname( listener );
		if (addr === null) throw new Error('get sock name ' + process.errno);

		var ret = 0;
		do {
			ret = socket.connect(client, addr);
		} while(ret === null & process.errno === 10035);

		if (ret === null){
			throw new Error("connect error " + process.errno);
		}

		var peer = socket.accept( listener );
		if (peer === null){
			throw new Error('accept error ' + process.errno);
			//continue
		}

		socket.nonblock(client, 1);
		return [peer, client];
	}
};

module.exports = socket;
