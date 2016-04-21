var uv  = require('uv');

function TTY (fd, readable){
	this._handle = new uv.TTY(fd, readable);
	this.readStart(function(){});
};

TTY.prototype.writeAsciiString =
TTY.prototype.writeBuffer =
TTY.prototype.writeUtf8String = function(req, data){
	this._handle.write(data);
};

TTY.prototype.getWindowSize = function(arr){
	var winsize = this._handle.get_winsize();
	if (!winsize){
		return process.errno;
	}

	arr[0] = winsize.width;
	arr[1] = winsize.height;
	return 0;
};

TTY.prototype.readStart = function(){
	var tcp = this;
	this._handle.read_start(function(err, buf){
		var len;
		if (err){
			len = err > 0 ? -err : err;
		} else if (buf){
			len = buf.length;
		} else { len = 0; }

		tcp.onread(len, buf);
	});
};

TTY.prototype.readStop = function(){
	return this._handle.read_stop();
};

TTY.prototype.setRawMode = function(mode){
	this._handle.set_mode(mode ? 1 : 0);
};

TTY.prototype.close = function(cb){
	this._handle.close();
	setTimeout(cb, 1);
};

exports.TTY = TTY;

exports.guessHandleType = function(h){
	return uv.guess_handle(h);
};

exports.isTTY = function(h){
	return uv.guess_handle(h) === 'TTY';
};
