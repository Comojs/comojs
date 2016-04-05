var uv     = require('uv');
var errno  = process.binding('errno');
var sock   = process.binding('socket');
var ASSERT = require('assert');

var TEST_PORT = 8080;

var connect_cb_called = 0;
var close_cb_called = 0;

function connect_cb(status) {
	this.close(close_cb);
	ASSERT.equal(status, errno.ECONNREFUSED);
	connect_cb_called++;
}

function close_cb() {
	close_cb_called++;
}

(function(){
	var addr = uv.ip4_address("127.0.0.1", 9999);
	// var addr = uv.ip4_address("8.8.8.89", 9999);
	ASSERT(addr !== null);

	var conn = new uv.TCP();

	// setTimeout(function(){
	// 	conn.close(close_cb);
	// }, 150);

	var r = conn.connect(addr, connect_cb);
	// if (r == UV_ENETUNREACH)
	//     RETURN_SKIP("Network unreachable.");
	ASSERT(r === 0);

})();

process.on("exit", function(){
	ASSERT.equal(connect_cb_called,1);
	ASSERT.equal(close_cb_called, 1);
});
