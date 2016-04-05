var assert   = require('assert');
var uv       = require('uv');
var errno    = require('errno');
var syscall  = require('syscall');
var timers   = require('timers');

var DETACHED_PROCESS           = 0x00000008;
var CREATE_NEW_PROCESS_GROUP   = 0x00000200;
var CREATE_UNICODE_ENVIRONMENT = 0x00000400;
var CREATE_NO_WINDOW           = 0x08000000;

var READ_PIPE  = 0;
var WRITE_PIPE = 1;

// TODO child_watcher ref

function Process (options) {

	this.exit_signal = 0;

	options = options || {};
	assert(options.file, "options.file required");

	assert(!(options.flags & ~(
		uv.PROCESS_DETACHED |
		uv.PROCESS_SETGID |
		uv.PROCESS_SETUID |
		uv.PROCESS_WINDOWS_HIDE |
		uv.PROCESS_WINDOWS_VERBATIM_ARGUMENTS
	)));

	var stdio_count = options.stdio_count;
	if (stdio_count < 3) stdio_count = 3;

	var err = errno.ENOMEM;

	var pipes = [];

	for (var i = 0; i < stdio_count; i++) {
		pipes[i]    = [];
		pipes[i][0] = -1;
		pipes[i][1] = -1;
	}

	for (var i = 0; i < options.stdio_count; i++) {
		err = this.init_stdio(options.stdio[i], pipes[i], i);
		if (err) throw new Error("STDIO initiate error " + err);
	}

	this.status = 0;
	this.pid = 0;
	this.exit_cb = options.exit_cb;

	// on error returns null and set process.errno
	// on success returns an object hold process
	// handle and process id
	var ret = this.child_init(options, stdio_count, pipes);
	this.pipes = pipes;

	if (ret === null) {
		err = process.errno;
		this.errno = errno.translate(process.errno);
	} else {
		this.process_handle = ret.process || -1;
		this.pid = ret.process_id || 0;
	}

	for (var i = 0; i < options.stdio_count; i++) {
		// set process id for all stream pipes
		// we need to use this with msgrecv function
		var stream = options.stdio[i].stream;
		if (stream){
			if (stream.type === 'NAMED_PIPE' || stream.type){
				options.stdio[i].stream.ipc_pid = this.pid;
			}
		}

		err = this.open_stream(options.stdio[i], pipes[i], i === 0);
		if (err === 0) continue;

		while (i--) {
			this.close_stream(options.stdio[i]);
		}
	}

	// Only activate this handle if exec() happened
	// successfully, we are hacky here as we are using
	// a timer loop to check for process status
	if ( !err && this.pid ) {
		var self = this;
		var process_handle = this.process_handle;
		self.child_watcher = setInterval(function(){
			var exitcode = uv.get_exit_code(process_handle);

			// 259 indicates that the
			// process still running
			if (exitcode === 259){
				return; /* do nothing we need to check again */
			}

			// stop child status watcher
			clearInterval(this);
			self.child_watcher = null;

			// close process handle
			assert(syscall.CloseHandle(self.process_handle) !== null);

			if (self.exit_cb) self.exit_cb.call(self, exitcode, self.exit_signal);

			for (var fd = 0; fd < pipes.length; fd++) {
				if (pipes[fd][0] > -1){
					uv.close(pipes[fd][0]);
				}
			}

		}, 1);
	} else {
		for (var fd = 0; fd < pipes.length; fd++) {
			if (pipes[fd][0] > -1){
				uv.close(pipes[fd][0]);
			}
		}
	}

	if (err) {
		this.errno = errno.translate(err);
	}
	return this;
}


Process.prototype.unref = function(){
	if (this.child_watcher){
		this.child_watcher.unref();
	}
	return 0;
};


Process.prototype.open_stream = function (container, pipefds, writable) {

	if (!(container.flags & uv.CREATE_PIPE) || pipefds[0] < 0) {
		return 0;
	}

	var flags = 0;

	if (container.stream.type === 'NAMED_PIPE' && container.stream.ipc ) {
		flags = uv.STREAM_READABLE | uv.STREAM_WRITABLE;
	}

	else if (writable) {
		flags = uv.STREAM_WRITABLE;
	}

	else {
		flags = uv.STREAM_READABLE;
	}

	return container.stream.stream_open(pipefds[1], flags);
};


// constructs a utf16 buffer of environment
// variables block, windows require each env to be
// seperated with 1 nul and ends with 2 nul charachters
function make_env_block(env){
	if (!env){
		return null;
	}

	var envBlock = process.env;

	//extend
	for (var key in envBlock){
		env.unshift(key + '=' + envBlock[key]);
	}

	var len = env.length;

	var n = "";
	for (var i = 0; i < len; i++){
		n += env[i] + '\0';
	}
	n += '\0\0';
	return new Buffer(n, 'ucs2');
}


function join_arguments (args, verbatim){
	if (!verbatim){
		for (var i = 0; i < args.length; i++){
			var arg = args[i];
			if (/\s/g.test(arg)){
				arg.replace(/"/g, '\"');
				arg = '"' + arg + '"'
				args[i] = arg;
			}
		}
	}
	args = args.join(' ');
	return syscall.UTF16PtrFromString(args);
}


Process.prototype.child_init = function(options, stdio_count, pipes) {

	var process_flags = CREATE_UNICODE_ENVIRONMENT;
	if (options.flags & uv.PROCESS_DETACHED) {
		process_flags |= DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP;
	}

	//initiate stdio handles
	var stdioHandles = [-1, -1, -1];

	for (var fd = 0; fd < stdio_count; fd++) {
		var use_handle   = pipes[fd][2];
		if (use_handle > -1) {
			if (fd <= 2) {
				stdioHandles[fd] = use_handle;
			} else {
				// store shared handles?
				options.env = options.env || [];
				options.env.push("COMO_FD_"+fd+'='+use_handle);
			}
		}
	}

	// working directory
	var cwd = null
	if (options.cwd) {
		cwd = syscall.UTF16PtrFromString(options.cwd);
	} else {
		cwd = syscall.GetCurrentDirectory();
		if (!cwd) return null;
	}

	// var path = syscall.Getenv('PATH');

	//custom env block
	var env = null;
	if (options.env) {
		env = make_env_block(options.env);
	}

	// CreateProcess syscall
	var info    = new syscall.ProcessInformation();
	var startup = new syscall.StartupInfo();

	startup.Cb = startup.size;
	startup.Flags = (syscall.STARTF_USESTDHANDLES | syscall.STARTF_USESHOWWINDOW);
	startup.StdInput  = stdioHandles[0];
	startup.StdOutput = stdioHandles[1];
	startup.StdError  = stdioHandles[2];

	if (options.flags & uv.PROCESS_WINDOWS_HIDE) {
		/* Use SW_HIDE to avoid any potential process window. */
		startup.ShowWindow = syscall.SW_HIDE;
	} else {
		startup.wShowWindow = syscall.SW_SHOWDEFAULT;
	}

	var program = null;
	var arguments = join_arguments(options.args,
		options.flags & uv.PROCESS_WINDOWS_VERBATIM_ARGUMENTS);

	// syscall CreateProcess
	// on failure returns null and set
	// process.errno to last error
	var ret = syscall.CreateProcess(
		program,      // programs path
		arguments,    // utf16 buffer of all args
		null,
		null,
		1,
		process_flags,
		env,          // utf16 env block
		cwd,          // child working director
		startup,      // startup info
		info          // new created process info
	);

	// duplicated handles passed to the child
	// we can close them now
	for (var fd = 0; fd < pipes.length; fd++) {
		if (pipes[fd][2] !== -1){
			uv.close(pipes[fd][2]);
		}
	}

	if (ret === null) return null;

	assert(syscall.CloseHandle(info.Thread) !== null);

	return {
		process: info.Process,
		process_id : info.ProcessId
	};
};


Process.prototype.init_stdio = function (container, fds, i) {
	var STDIO_MASK = uv.IGNORE | uv.CREATE_PIPE | uv.INHERIT_FD | uv.INHERIT_STREAM;

	// initiated fd to invalid handle
	// ignore by default
	if (i <= 2) fds[2] = -1;

	if (!container) return 0;
	switch (container.flags & STDIO_MASK){
		case uv.IGNORE : {
			return 0;
		}

		case uv.CREATE_PIPE : {
			assert(container.stream.type === 'NAMED_PIPE');

			if (uv.make_socketpair(fds, 0)) throw new Error("Error creating socketpair");
			var fh = fds[0];
			var inherit_handle = -1;
			if (i > 2) {
				inherit_handle = uv.make_inheritable(fh);
				inherit_handle = uv.duplicate_handle(inherit_handle);
			} else {
				inherit_handle = uv.duplicate_handle(fh);
			}

			fds[2] = inherit_handle;
			return 0;
		}

		case uv.INHERIT_FD :
		case uv.INHERIT_STREAM : {
			if (container.flags & uv.INHERIT_FD) {
				fd = container.fd;
			} else {
				fd = container.stream.fd;
			}

			if (typeof fd === 'undefined' || fd == -1){
				return errno.EINVAL;
			}

			//duplicate fd to handle
			var handle = uv.get_fd_handle(fd);
			if (handle === null) return process.errno;
			var dupHandle = uv.duplicate_handle(handle);
			fds[2] = dupHandle;
			return 0;
		}

		default : {
			throw new Error("unknown stdio type");
		}
	}
};


Process.prototype.kill = function(signum){
	var process = this;
	var err;

	if (process.process_handle == -1) {
		return errno.EINVAL;
	}

	err = uv.Win32kill(process.process_handle, signum);
	if (err) return err;  /* err is already translated. */
	process.exit_signal = signum;
	return 0;
};


Process.prototype.close = function(cb){
	var self = this;

	// clean opened pipes
	var pipes = this.pipes || [];
	for (var fd = 0; fd < pipes.length; fd++) {
		if (pipes[fd][0] > -1){
			uv.close(pipes[fd][0]);
		}
	}

	// only close if process handle is there
	if (this.process_handle){
		uv.close(this.process_handle);
	}

	//clear child watcher interval
	if (this.child_watcher){
		clearInterval(this.child_watcher);
	}
};

module.exports = Process;
