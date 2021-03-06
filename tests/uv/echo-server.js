var uv     = require('uv');
var errno  = require('errno');
var sock   = require('socket');
var ASSERT = require('assert');

var port = 9095;
var serverType;
var server_closed;

function on_server_close (){
	console.log('closing server');
}

function on_close (){

}

function after_shutdown (){
	this.close();
	console.log("shutdown");
}

function after_write (){}

function after_read(err, buf) {
	console.log("reading");
	var nread = buf ? buf.length : 0;
	if (err) {

		//FIXME: echo server report 10063 error on win32
		/* Error or EOF */
		// ASSERT.strictEqual(err, errno.EOF);

		this.shutdown(after_shutdown);
		return;
	}

	if (nread == 0) {
		/* Everything OK, but nothing read. */
		return;
	}

	// console.log(buf);

	/*
	* Scan for the letter Q which signals that we should quit the server.
	* If we get QS it means close the stream.
	*/

	if (!server_closed) {
		if (buf.indexOf("QS") > -1){
			this.close(on_close);
		} else if (buf.indexOf("Q") > -1){
			this.server.close(on_server_close);
			server_closed = 1;
		}
	}

	this.write(buf, after_write);
}

function on_connection(status) {

	var stream;

	if (status !== 0) {
		print("Connect error %s\n" + status);
	}

	ASSERT(status == 0);

	switch (serverType) {
		case "TCP":
			stream = new uv.TCP();
			break;

		case "PIPE":
			// stream = malloc(sizeof(uv_pipe_t));
			// ASSERT(stream != NULL);
			// r = uv_pipe_init(loop, (uv_pipe_t*)stream, 0);
			// ASSERT(r == 0);
			break;
		default:
		throw new Error("Bad Server Type");
	}

	/* associate server with stream */
	stream.server = this;

	ASSERT(this.accept(stream) == 0);
	// console.log("client fd " + stream.fd);
	stream.read_start(after_read);
}

function tcp_server (){

	var addr = uv.ip4_address("0.0.0.0", port);
	ASSERT(addr !== null);

	serverType = "TCP";

	var tcpServer = new uv.TCP();

	var r = tcpServer.bind(addr, 0);
	if (r) {
		/* TODO: Error codes */
		print("Bind error\n");
		return 1;
	}

	r = tcpServer.listen(sock.SOMAXCONN, on_connection);
	if (r) {
		/* TODO: Error codes */
		console.log("Listen error: %s\n", errno.toString(r));
		return 1;
	}

	return 0;
}


if (process.argv[2] === '--close'){
	var addr = uv.ip4_address("127.0.0.1", port);
	var tcp_client = new uv.TCP();
	tcp_client.connect(addr, function(e){
		try {
			this.write('Q', function(){});
			this.close();
		} catch (e){}
	});
} else {
	tcp_server();
}
