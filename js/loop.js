var loop = process.binding('loop');
var util = require('util');
exports.POLLOUT = loop.POLLOUT;
exports.POLLIN  = loop.POLLIN;
exports.POLLERR = loop.POLLERR;
exports.POLLHUP = loop.POLLHUP;

const TIMER = 0;
const IO    = 1;

exports.main = new Loop();

exports.init = function(){
	return new Loop();
};

function Handle (loopHandle, cb){
	if (cb) this.cb = cb;
	this._handle = loop.handle_init(loopHandle, cb);
}

Handle.prototype.ref = function(){
	loop.handle_ref(this._handle);
};

Handle.prototype.unref = function(){
	loop.handle_unref(this._handle);
};

Handle.prototype.io_start = function(fd, events, cb){
	if (cb) this.cb = cb;
	loop.io_start(this._handle, fd, events, cb);
};

Handle.prototype.io_stop = function(events){
	loop.io_stop(this._handle, events);
};

Handle.prototype.io_active = function(events){
	return loop.io_active(this._handle, events);
};

Handle.prototype.timer_start = function(timeout, repeat, cb){
	if (cb) this.cb = cb;
	loop.timer_start(this._handle, timeout, repeat, cb);
};

Handle.prototype.timer_stop = function(timeout, repeat, cb){
	loop.timer_stop(this._handle);
};

Handle.prototype.timer_again = function(timeout, repeat, cb){
	loop.timer_again(this._handle);
};


Handle.prototype.close = function(events){
	loop.handle_close(this._handle, events);
};

function Loop (){
	this._handle = loop.init();
	for (var key in loop){
		if (key === 'run' || key === 'update_time') continue;
		this[key] = loop[key];
	}
}

Loop.prototype.update_time = function(type){
	return loop.update_time(this._handle);
};

Loop.prototype.run = function(type){
	return loop.run(this._handle, type);
};

// inititae new handle
Loop.prototype.handle = function(cb){
	return new Handle(this._handle, cb);
};

// initiate io handle
Loop.prototype.io = function(cb){
	return new IOHandle(this._handle, cb);
};

/* IO HANDLE */
function IOHandle (loopHandle, cb){
	if (cb) this.cb = cb;
	this._handle = loop.handle_init(loopHandle, cb);
}

IOHandle.prototype.close = function(events){
	loop.handle_close(this._handle, events);
};

IOHandle.prototype.start = function(fd, events, cb){
	if (cb) this.cb = cb;
	loop.io_start(this._handle, fd, events, cb);
};

IOHandle.prototype.active = function(events){
	return loop.io_active(this._handle, events);
};

IOHandle.prototype.stop = function(events){
	loop.io_stop(this._handle, events);
};

IOHandle.prototype.handle_stop = function(){
	loop.handle_stop(this._handle);
};

IOHandle.prototype.ref = function(){
	loop.handle_ref(this._handle);
};

IOHandle.prototype.unref = function(){
	loop.handle_unref(this._handle);
};

exports.setTimeout = setTimeout;
exports.setInterval = setInterval;
exports.clearInterval = clearInterval;
exports.clearTimeout = clearTimeout;
