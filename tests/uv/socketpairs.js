var sock = process.binding('socket');
var uv = require('uv');
var assert = require('assert');

var fds = [];

var ping = "ping";
var pong = "pong";

var pingpongs = [];

uv.make_socketpair(fds, 1);

var loop = require('loop');

count = 0;
var handle = loop.io(function(){
	var data = uv.read(fds[1], 1000);
	pingpongs.push(data);
	uv.write(fds[1], ping, ping.length);
});

handle.start(fds[1], loop.POLLIN);

var handle2 = loop.io(function(){
	var data = uv.read(fds[0], 1000);
	pingpongs.push(data);
	uv.write(fds[0], pong, pong.length);
});

handle2.start(fds[0], loop.POLLIN);

uv.write(fds[1], ping, ping.length);

setTimeout(function(){
	handle.close();
	handle2.close();
}, 1000);

process.on('exit', function(){
	assert(uv.close(fds[0]));
	assert(uv.close(fds[1]));

	assert.strictEqual(pingpongs[0], 'ping');
	assert.strictEqual(pingpongs[1], 'pong');
	assert.strictEqual(pingpongs[2], 'ping');
	assert.strictEqual(pingpongs[3], 'pong');
	// console.log(pingpongs);
});
