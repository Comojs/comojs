var uv           = require('uv');
var MakeCallback = process.MakeCallback;
var syscall      = require('syscall');
var tcpWrap      = process.binding('tcp_wrap').TCP;
var errno        = require('errno');


function Pipe(ipc){
	this._handle = new uv.Pipe(ipc);
}


Pipe.prototype.close = function(cb){
	var pipe = this;
	pipe._handle.close(cb);
};


Pipe.prototype.readStop = function(){
	throw new Error('read stop');
	return this._handle.read_stop();
};


Pipe.prototype.writeBuffer =
Pipe.prototype.writeUtf8String = function(req, data, send_handle){
	var stream = this;

	if (send_handle){
		send_handle = send_handle._handle;
	}

	this._handle.write(data, function(status){
		stream.writeQueueSize = stream._handle.write_queue_size;
		req.bytes = this.bytes;
		MakeCallback(req, "oncomplete", status, stream, req, 0);
	}, send_handle);
	return 0;
};


Pipe.prototype.open = function(fd){
	return this._handle.open(fd);
};


Pipe.prototype.unref = function(fd){
	this._handle.io_watcher.unref();
	return 0;
};


Pipe.prototype.ref = function(fd){
	this._handle.io_watcher.ref();
	return 0;
};


Pipe.prototype.readStart = function(){
	var pipe = this;

	pipe._handle.read_start(function(err, buf){
		var handle = pipe._handle;

		// get pending type
		var type   = 'UNKNOWN_HANDLE';
		if (handle.type === 'NAMED_PIPE' && handle.ipc &&
			uv.pipe_pending_count(handle) > 0){
			type = uv.pipe_handle_type(handle);
		}

		var nread = 0;
		if (err){
			nread = err > 0 ? -err : err;
		}

		else if (buf){
			nread = Buffer.byteLength(buf);
		}

		else { nread = 0; }

		if (nread === 0) return;

		var pending_object;
		if (type !== 'UNKNOWN_HANDLE'){
			pending_object = new tcpWrap();
			var ret = this.accept(pending_object._handle);
			if (ret){
				throw new Error("pending object error");
			}
		}
		MakeCallback(pipe, 'onread', nread, Buffer(buf).toString(), pending_object);
	});
};

exports.Pipe = Pipe;
