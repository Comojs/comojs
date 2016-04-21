var uv       = require('uv');
var posix    = process.binding('posix');
var stream   = require('uv/stream');
var syscall  = require('syscall');
var C        = require('C');
var sock     = require('socket');

var libc       = syscall.LoadLibrary(null);
var tcsetattr  = libc.GetProcAddress('tcsetattr', -1, 3);
var tcgetattr  = libc.GetProcAddress('tcgetattr', -1, 2);
var cfmakeraw  = libc.GetProcAddress('cfmakeraw', -1, 1);

const IGNBRK  = 0000001;
const BRKINT  = 0000002;
const IGNPAR  = 0000004;
const PARMRK  = 0000010;
const INPCK   = 0000020;
const ISTRIP  = 0000040;
const INLCR   = 0000100;
const IGNCR   = 0000200;
const ICRNL   = 0000400;
const IUCLC   = 0001000;
const IXON    = 0002000;
const IXANY   = 0004000;
const IXOFF   = 0010000;
const IMAXBEL = 0020000;
const IUTF8   = 0040000;

const TCSANOW   = 0;
const TCSADRAIN = 1;
const TCSAFLUSH = 2;

var orig_termios_fd = -1;
var orig_termios;

var termios = C.Struct.create({
	c_iflag    : 'uint',
	c_oflag    : 'uint',
	c_cflag    : 'uint',
	c_lflag    : 'uint',
	c_line     : 'uint8',
	c_cc       : 32,
	__c_ispeed : 'uint',
	__c_ospeed : 'uint'
});


module.exports = function (fd, readable){
	var self = this;

	var newfd = uv.open("/dev/tty", uv.O_RDWR);
	var r = posix.dup2(newfd, fd);
	if (r === null && process.errno !== errno.EINVAL){
		uv.close(newfd);
		return process.errno;
	}
	this.fd = r;
	uv.nonblock(this.fd, 1);
	uv.cloexec(this.fd, 1);
	if (readable){
		this.readable = true;
	}
};


uv.TTY.prototype.read_start = function(cb){
	var self = this;
	this._doread = true;
	this.read_cb = cb;
	if (!this.readable) return;
	if (this.timer) clearInterval(this.timer);

	var b = Buffer(10);
	self.timer = setInterval(function(){
		while (self._doread){
			var n = sock.can_read(self.fd, 1);
			if (n){
				var n = posix.read(self.fd, b);
				self.read_cb(0, b.toString().slice(0, n));
			} else {
				break;
			}
		}
	}, 1);
};


uv.TTY.prototype.read_stop = function(cb){
	this._doread = false;
	if (this.timer) clearInterval(this.timer);
	this.timer = false;
};


uv.TTY.prototype.write = function(data){
	posix.writeBuffer(this.fd, Buffer(data));
};


uv.TTY.prototype.stop = function(){
	throw new Error('win tty stop');
};

uv.TTY.prototype.close = function(cb){
	this._doread = false;
	if (this.timer) clearInterval(this.timer);
	this.timer = false;
};

uv.TTY.prototype.get_winsize = function(){
	var fd = this.fd;
	var ws = new syscall.WinSize();
	if (syscall.ioctl(fd, syscall.SYS.TIOCGWINSZ, ws) === null){
		return null;
	}
	return {
		width  :  ws.ws_col,
		height :  ws.ws_row
	}
};


uv.TTY.prototype.set_mode = function(mode){
	if (this.mode === mode) return;
	this.mode = mode;

	if (!this.orig_termios){
		this.orig_termios = new termios();
		if (tcgetattr(this.fd, this.orig_termios) === null){
			throw new Error(process.errno);
		}

		if (!orig_termios){
			orig_termios_fd = this.fd;
			orig_termios = new termios(this.orig_termios);
		}
	}

	var temp = new termios(this.orig_termios);

	if (mode){
		temp.c_iflag &= ~(BRKINT | ICRNL | INPCK | ISTRIP | IXON);
		temp.c_oflag |= (0000004);
		temp.c_cflag |= (0000060);
		temp.c_lflag &= ~(0000010 | 0000002 | 0100000 | 0000001);
		temp.c_cc[6] = 1;
		temp.c_cc[5] = 0;
	}

	if (tcsetattr(this.fd, TCSADRAIN, temp) === null) {
		throw new Error('cant set raw');
	}

	return 0;
};


process.on('exit', function(){
	if (orig_termios_fd !== -1){
		tcsetattr(orig_termios_fd, TCSANOW, orig_termios);
	}
});
