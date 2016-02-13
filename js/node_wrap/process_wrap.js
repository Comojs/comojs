
var uv           = require('uv');
var MakeCallback = process.MakeCallback;
var cons = require('constants');

function Process (){

}

// convert signal number to string
// return null if not found
function signum_to_string(signum){
	if (signum === 0) return null;
	for (var key in cons){
		if (cons[key] === signum){
			return key;
		}
	}
	return null;
}


function ParseStdioOptions(stdios, options){

	var stdioLength = stdios.length
	var stdio_container = uv.stdio_container(stdioLength);

	// options.stdio_count = stdioLength;

	for (var i = 0; i < stdioLength; i++){
		var stdio = stdios[i];
		var type  = stdio.type;

		//ignor
		if (type === 'ignore'){
			stdio_container[i].flags = uv.IGNORE;
		}

		//pipe
		else if (type === 'pipe'){
			stdio_container[i].flags = uv.CREATE_PIPE | uv.STREAM_READABLE | uv.STREAM_WRITABLE;
			stdio_container[i].stream = stdio.handle._handle;
		}

		//inherit
		else if (type === 'fd' || type === 'inherit') {
			stdio_container[i].flags  = uv.INHERIT_FD;
			stdio_container[i].fd     = stdio.fd;
		}

		else {
			console.log(stdio);
			throw new Error('unknown type!');
		}
	}

	return stdio_container;
}


Process.prototype.spawn = function(js_options){
	var process = this;

	var options   = {};
	options.flags = 0;
	options.file  = js_options.file;
	options.cwd   = js_options.cwd || null;
	options.args  = js_options.args || [];

	if (!options.file){
		throw new Error("Bad argument");
	}

	options.stdio_count = js_options.stdio.length;
	options.stdio = ParseStdioOptions(js_options.stdio);


	//env pairs
	var env = js_options.envPairs;
	if (!env){
		throw new Error("TODO set current env block");
	}

	options.env = env;

	if ( js_options.windowsVerbatimArguments ){
		options.flags |= uv.PROCESS_WINDOWS_VERBATIM_ARGUMENTS;
	}

	// detach process
	if ( js_options.detached ) {
		options.flags |= uv.PROCESS_DETACHED;
	}

	// options.uid
	if ( js_options.uid ) {
		options.flags |= uv.PROCESS_SETUID;
		options.uid    = js_options.uid;
	}

	// options.uid
	if ( js_options.gid ) {
		options.flags |= uv.PROCESS_SETGID;
		options.gid = js_options.gid;
	}

	// on exit call back
	options.exit_cb = function(status, term_signal){
		var sig = signum_to_string(term_signal);
		// MakeCallback(process, 'onexit', status, sig);
		process.onexit(status, sig);
	};

	this._handle = uv.spawn(options);
	if (this._handle.errno){
		return -this._handle.errno;
	}

	this.pid = this._handle.pid;
	return 0;
};


Process.prototype.unref = function(){
	return this._handle.unref();
};


Process.prototype.kill = function(signum){
	return this._handle.kill(signum);
};


Process.prototype.close = function(cb){
	return this._handle.close(cb);
};

exports.Process = Process;
