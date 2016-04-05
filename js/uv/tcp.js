var util   = require("util");
var stream = require('uv/stream');
var sock   = require('socket');
var errno  = require('errno');
var loop   = require('loop');
var uv     = require('uv');
var assert = require('assert');

var isWin  = process.platform === "win32";

util.inherits(TCP, stream);
function TCP (){
	stream.call(this, 'TCP');
}


TCP.prototype.open = function(s){
	if (!sock.nonblock(s, 1)){
		return process.errno;
	}

	return this.stream_open(s, uv.STREAM_READABLE | uv.STREAM_WRITABLE);
};


TCP.prototype.maybe_new_socket = function(domain, flags){
	if (domain == sock.AF_UNSPEC || this.fd !== -1) {
		this.flags |= flags;
		return 0;
	}

	var fd = uv.socket(domain, sock.SOCK_STREAM, 0);
	if (!fd) return process.errno;

	this.stream_open(fd, flags);
	return 0;
};


TCP.prototype.simultaneous_accepts = function(enable){
	return 0;
};


TCP.prototype.bind = function(addr, flags) {

	var family = sock.family(addr);

	/* Cannot set IPv6-only mode on non-IPv6 socket. */
	if ((flags & uv.TCP_IPV6ONLY) && family !== uv.AF_INET6) {
		return errno.EINVAL;
	}

	var err = this.maybe_new_socket(family, uv.STREAM_READABLE | uv.STREAM_WRITABLE);

	if (err) return err;

	var set = process.platform === 'win32' ? 0 : 1;
	if (!sock.setsockopt(this.fd, sock.SOL_SOCKET, sock.SO_REUSEADDR, set)) {
		return process.errno;
	}

	process.errno = 0;
	if (!sock.bind(this.fd, addr) && process.errno !== errno.EADDRINUSE) {
		if (process.errno === errno.EAFNOSUPPORT) {
			/* OSX, other BSDs and SunoS fail with EAFNOSUPPORT when binding a
			* socket created with AF_INET to an AF_INET6 address or vice versa. */
			return errno.EINVAL;
		}
		return process.errno;
	}

	this.delayed_error = process.errno;

	if (family === sock.AF_INET6) {
		this.flags |= uv.HANDLE_IPV6;
	}

	return 0;
};


TCP.prototype.listen = function(backlog, cb){
	var self = this;

	if (this.delayed_error) {
		return this.delayed_error;
	}

	this.maybe_new_socket(sock.AF_INET, uv.STREAM_READABLE);

	if (!sock.listen(this.fd, backlog)){
		return process.errno;
	}

	this.connection_cb = cb.bind(this);

	// close previous loop watcher and
	// create new one to be handled with
	// server_io function
	self.io_watcher.close();
	this.io_watcher = loop.io(function(h, events){
		self.server_io(events);
	});

	this.io_watcher.start(this.fd, loop.POLLIN);
	return 0;
};


TCP.prototype.connect = function(addr, cb){
	var self = this;

	if (this.connect_req){
		return errno.EALREADY;
	}

	var family = sock.family(addr);

	var err = this.maybe_new_socket(family, uv.STREAM_READABLE | uv.STREAM_WRITABLE);
	if (err) return err;

	this.delayed_error = 0;
	this.connect_req    = 1;
	if (cb) this.connect_req_cb = cb.bind(this);

	self.io_watcher.start(self.fd, loop.POLLIN | loop.POLLOUT | loop.POLLERR);
	sock.connect(this.fd, addr);

	return 0;
};

module.exports = TCP;
