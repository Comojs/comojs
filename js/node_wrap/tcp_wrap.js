var sock    = process.binding('socket');
var uv      = require('uv');
var errno   = require('errno');

exports.TCP = TCP;
exports.TCPConnectWrap = TCPConnectWrap;

var MakeCallback = process.MakeCallback;

function TCPConnectWrap (){}

function TCP (){
	this.writeQueueSize = 0;
	this._handle = new uv.TCP();
}


TCP.prototype.bind6 = TCP.prototype.bind = function(ip, port){
	var addr = uv.ip_address(ip, port);
	if (!addr){
		return process.errno;
	}

	this.bindPort = port;
	this.bindAddress = ip;
	var err = this._handle.bind(addr, 0);
	return err;
};


TCP.prototype.close = function(cb){
	var tcp = this;
	process.nextTick(function(){
		tcp._handle.close(cb);
	});
};


TCP.prototype.listen = function(backlog){
	var tcp = this;
	//pass onConnection callback
	return this._handle.listen(backlog, function(status){
		if (!status){
			client = new TCP();
			this.accept(client._handle);
		}
		MakeCallback(tcp, "onconnection", status, client);
	});
};


TCP.prototype.readStart = function(){
	var tcp = this;
	this._handle.read_start(function(err, buf){
		var len;
		if (err){
			len = err > 0 ? -err : err;
		}

		else if (buf){
			len = buf.length;
		}

		// nread == 0
		else { return; }
		MakeCallback(tcp, "onread", len, buf);
	});
};


TCP.prototype.readStop = function(){
	return this._handle.read_stop();
};


TCP.prototype.open = function(fd){
	return this._handle.open(fd);
};


TCP.prototype.setSimultaneousAccepts = function(enable) {
	return this._handle.simultaneous_accepts(enable);
};


TCP.prototype.shutdown = function(req){
	var tcp = this;
	this._handle.shutdown(function(status){
		MakeCallback(req, "oncomplete", status, tcp, req);
	});
};


TCP.prototype.writeBinaryString = function(req, data){
	data = Buffer(data, "binary");
	return this.writeUtf8String(req, data.toString("binary"));
};


TCP.prototype.writeAsciiString =
TCP.prototype.writeBuffer =
TCP.prototype.writeUtf8String = function(req, data){
	var tcp = this;
	this._handle.write(data, function(status){
		tcp.writeQueueSize = tcp._handle.write_queue_size;
		req.bytes = this.bytes;
		MakeCallback(req, "oncomplete", status, tcp, req, 0);
	});

	return 0;
};


TCP.prototype.connect = function(req_wrap_obj, ip_address, port){
	var tcp = this;
	var addr = uv.ip_address(ip_address, port);
	if (addr === null){
		return errno.translate(process.errno);
	}

	var err = this._handle.connect(addr, function AfterConnect (status){
		MakeCallback(req_wrap_obj, "oncomplete", errno.translate(status), tcp, req_wrap_obj, true, true);
	});
	return errno.translate(err);
};


// TODO: use syscall!!
// FIXME: handle errors
TCP.prototype.getsockname = function(out){
	var addr = sock.getsockname(this._handle.fd);
	var info = sock.addr_info(addr);
	out.address = this.bindAddress || info[0];
	out.port    = this.bindPort    || info[1];
	switch (sock.isIP(out.address)){
		case 4 : out.family = 'IPv4'; break;
		case 6 : out.family = 'IPv6'; break;
		default : throw new Error('unknown family type');
	}
};


TCP.prototype.getpeername = function(out){
	var peerinfo = this._handle.getpeername();
	out.address = peerinfo[0];
	out.port = peerinfo[1];
	return 0;
};


TCP.prototype.setKeepAlive = function(){
	// throw new Error('setKeepAlive');
};


TCP.prototype.unref = function(){
	this._handle.unref();
	return 0;
};


TCP.prototype.ref = function(fd){
	this._handle.ref();
	return 0;
};
