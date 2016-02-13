var uv = require('uv');
var socket = require('socket');
var assert = require('assert');
var errno = require('errno');
var TEST_PORT = 8080;

var connect_cb_called = 0;
var write_cb_called = 0;
var close_cb_called = 0;

// static uv_connect_t connect_req;
// static uv_write_t write_req;


function close_socket(sock) {
    var fileno = sock.fd;
    assert(fileno > -1);
    var ret = socket.close(fileno);
    console.log(fileno);
    assert(ret !== null, process.errno);
}


function close_cb(handle) {
    close_cb_called++;
}


function write_cb(status) {
    assert(status !== 0);
    console.log("uv.write error: %s\n", errno.toString(status));
    write_cb_called++;
    this.handle.close(close_cb);
}


function connect_cb(status) {
    var stream = this;
    // assert.strictEqual(stream, connect_req);
    assert.equal(status, 0);

    connect_cb_called++;

    /* close the socket, the hard way */
    close_socket(stream);

    var r = stream.write("hello\n", write_cb);
    assert(r == 0);
}


(function() {
    var r;
    var addr = uv.ip4_addr("127.0.0.1", TEST_PORT);
    assert(addr !== null);

    var client = new uv.TCP();
    r = client.connect(addr, connect_cb);
    assert(r == 0);
})();

process.on('exit', function(){
    assert(connect_cb_called == 1);
    assert(write_cb_called == 1);
    assert(close_cb_called == 1);
});
