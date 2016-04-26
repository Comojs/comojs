var uv = require('uv');

var kOnTimeout = 'ontimeout';

function Timer() {
	var handle = uv.new_timer();

	Object.defineProperty(this, "_handle", {
		enumerable: false,
		writable: true
	});

	this._handle = handle;
	return this;
}

Timer.kOnTimeout = kOnTimeout;

Timer.prototype.start  = function (timeout, repeat) {
	var handle = this._handle;
	uv.timer_start(handle, timeout, repeat || -1, OnTimeout.bind(this));
};

Timer.prototype.stop  = function (timeout, repeat) {
	var handle = this._handle;
	uv.timer_stop(handle);
};

Timer.prototype.close = function(cb){
	uv.handle_close(this._handle, cb);
};

Timer.prototype.unref = function(){
	uv.unref(this._handle);
};

Timer.prototype.ref = function(){
	uv.ref(this._handle);
};

Timer.now = function () {
	var now = uv.update_time();
	if (uv.now){
		return uv.now();
	}
	return now;
};

function OnTimeout (handle) {
	var wrap = this;
	process.MakeCallback(wrap, kOnTimeout);
}

module.exports = {
	Timer : Timer,
	kOnTimeout : Timer.kOnTimeout
};
