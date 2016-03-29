var assert   = require('assert');
var uv       = require('uv');
var errno    = require('errno');
var syscall  = require('syscall');
var SYS      = syscall.SYS;
var timers   = require('timers');
var C        = require('C');

var DETACHED_PROCESS           = 0x00000008;
var CREATE_NEW_PROCESS_GROUP   = 0x00000200;
var CREATE_UNICODE_ENVIRONMENT = 0x00000400;
var CREATE_NO_WINDOW           = 0x08000000;

var READ_PIPE  = 0;
var WRITE_PIPE = 1;

function _exit(n){
	process.reallyExit(n);
}

function init_stdio (container, fds) {
	var mask = uv.IGNORE | uv.CREATE_PIPE | uv.INHERIT_FD | uv.INHERIT_STREAM;
	var fd;

	switch( container.flags & mask ){
		case uv.IGNORE : {
			return 0;
		}

		case uv.CREATE_PIPE : {
			assert(container.stream.type === 'NAMED_PIPE');
			if (uv.make_socketpair(fds, 0)) throw new Error("Error creating socketpair");
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

			fds[1] = fd;
			return 0;
		}

		default : {
			throw new Error("unknown stdio type");
		}
	}
}

function write_int (fd, val){
	val = "" + val; //stringify
	var n;
	do {
		n = uv.write(fd, val, val.length);
	} while (n === null && process.errno === errno.EINVAL);

	if (n === null && process.errno === errno.EPIPE){
		return;
	}
}


var jargs;
function make_args_block (args){
	for (var i = 0; i < args.length; i++){
		args[i] = args[i] + '\0';
	}
	jargs = Buffer(args.join(''));
	return jargs;
}

function child_init (options, stdio_count, pipes, error_fd){

	var fd, use_fd, close_fd;

	if (options.flags & uv.PROCESS_DETACHED) {
		syscall.setsid();
	}

	/* First duplicate low numbered fds, since it's not safe to duplicate them,
	 * they could get replaced. Example: swapping stdout and stderr; without
	 * this fd 2 (stderr) would be duplicated into fd 1, thus making both
	 * stdout and stderr go to the same fd, which was not the intention. */
	for (fd = 0; fd < stdio_count; fd++) {
		use_fd = pipes[fd][1];
		if (use_fd < 0 || use_fd >= fd) continue;

		pipes[fd][1] = syscall.fcntl(use_fd, SYS.F_DUPFD, stdio_count);
		if (pipes[fd][1] === null) {
			write_int(error_fd, process.errno);
			_exit(127);
		}
	}

	for (fd = 0; fd < stdio_count; fd++) {

		close_fd = pipes[fd][0];
		use_fd   = pipes[fd][1];

		if (use_fd < 0) {
			if (fd >= 3) {
				continue;
			}

			else {
				// redirect stdin, stdout and stderr to /dev/null even if
				// uv.IGNORE is set
				use_fd = syscall.Open("/dev/null", fd == 0 ? SYS.O_RDONLY : SYS.O_RDWR);
				close_fd = use_fd;

				if (use_fd === null) {
					write_int(error_fd, process.errno);
					_exit(127);
				}
			}
		}

		if (fd === use_fd) {
			uv.cloexec(use_fd, 0);
		}
		else {
			fd = syscall.dup2(use_fd, fd);
		}

		if (fd === null) {
			write_int(error_fd, process.errno);
			_exit(127);
		}

		if (fd <= 2) {
			uv.nonblock(fd, 0);
		}

		if (close_fd >= stdio_count) {
			uv.close(close_fd);
		}
	}

	for (fd = 0; fd < stdio_count; fd++) {
		use_fd = pipes[fd][1];
		if (use_fd >= stdio_count) {
			uv.close(use_fd);
		}
	}

	if (options.cwd) {
		var ret = syscall.chdir(options.cwd);
		if (ret === null){
			write_int(error_fd, process.errno);
			_exit(127);
		}
	}

	if (options.flags & (uv.PROCESS_SETUID | uv.PROCESS_SETGID)) {
		/* When dropping privileges from root, the `setgroups` call will
		 * remove any extraneous groups. If we don't call this, then
		 * even though our uid has dropped, we may still have groups
		 * that enable us to do super-user things. This will fail if we
		 * aren't root, so don't bother checking the return value, this
		 * is just done as an optimistic privilege dropping function.
		 */
		var olderrno = process.errno;
		syscall.setgroups(0, null);
		process.errno = olderrno;
	}

	if ((options.flags & uv.PROCESS_SETGID) && syscall.setgid(options.gid) === null) {
		write_int(error_fd, process.errno);
		_exit(127);
	}

	if ((options.flags & uv.PROCESS_SETUID) && syscall.setuid(options.uid) === null) {
		write_int(error_fd, process.errno);
		_exit(127);
	}

	if (options.env) {
		set_env_block(options.env);
	}

	var args = options.args.slice(0);
	args.unshift(options.file);

	// make sure to convert everything to strings
	for (var i = 0; i < args.length; i++){
		args[i] = String(args[i]);
	}
	args.push(null);

	if (syscall.execlp.apply(null, args) === null){
		write_int(error_fd, process.errno);
	}

	// write_int(error_fd, options.cwd);
	// var n = write_int(error_fd, "done");
	// // console.log(n);
	// console.log(process.errno);
	// console.log('done');
}

// TODO child_watcher ref

function Process (options) {
	var self = this;
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
	var signal_pipe = [ -1, -1 ];

	for (var i = 0; i < stdio_count; i++) {
		pipes[i]    = [];
		pipes[i][0] = -1;
		pipes[i][1] = -1;
	}

	for (var i = 0; i < options.stdio_count; i++) {
		err = init_stdio(options.stdio[i], pipes[i], i);
		if (err) throw new Error("STDIO initiate error " + err);
	}

	// initiate child parent signal pipes
	if (uv.make_pipe(signal_pipe, 0)) throw new Error("Error creating signal pipe");

	/* Acquire write lock to prevent opening new fds in worker threads */
	// uv_rwlock_wrlock(&loop->cloexec_lock);

	var pid = syscall.fork();
	if (pid === null){
		throw new Error("can't fork");
	}

	// child process
	if (pid === 0){
		child_init(options, stdio_count, pipes, signal_pipe[1]);
		process.reallyExit(0);
	}

	/* Release lock in parent process */
	// uv_rwlock_wrunlock(&loop->cloexec_lock);
	uv.close(signal_pipe[1]);

	// waitpid status
	var status = new C.void( C.sizeOf.int );
	var r;
	var spawn_error = 0;

	do {
		r = uv.read(signal_pipe[0], 1024);
	} while (r === null && process.errno === errno.EINTR);

	if (r === null && process.errno === errno.EOF){
		/* okay, EOF - do nothing */
	}
	else if (r) {
		do {
			err = syscall.waitpid(pid, status, 0);  //okay, read errorno
		} while (err === null && process.errno == errno.EINTR);
		assert(err == pid);
		spawn_error = Number(r);
	}
	else if (r === null && process.errno === errno.EPIPE) {
		// do
		// 	err = waitpid(pid, &status, 0); /* okay, got EPIPE */
		// while (err == -1 && errno == EINTR);
		// assert(err == pid);
	}
	else {
		throw new Error('spawn error ' + process.errno);
	}

	uv.close(signal_pipe[0]);

	this.pipes = pipes;
	for (var i = 0; i < options.stdio_count; i++) {
		err = this.open_stream(options.stdio[i], pipes[i], i === 0);
		if (err === 0) continue;

		while (i--) {
			this.close_stream(options.stdio[i]);
		}
	}

	this.pid = pid;
	this.exit_cb = options.exit_cb;

	if (!spawn_error){
		this.child_watcher = setInterval(function(){
			var t = syscall.waitpid(pid, status, SYS.WNOHANG);
			if (t === pid){
				var s = status.int;
				var exitcode = 0;
				var termsignal = 0;

				if (syscall.WIFEXITED(s)){
					exitcode = syscall.WEXITSTATUS(s);
				} else {
					termsignal = syscall.WTERMSIG(s);
				}

				if (self.exit_signal){
					termsignal = self.exit_signal;
				}

				clearInterval(this);
				self.child_watcher = null;

				if (self.exit_cb) self.exit_cb.call(self, exitcode, termsignal);
			}
		}, 1);
	}

	if (spawn_error) {
		this.errno = errno.translate(spawn_error);
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
	var flags = 0;

	if (!(container.flags & uv.CREATE_PIPE) || pipefds[0] < 0) {
		return 0;
	}

	if (uv.close(pipefds[1]) === null){
		throw new Error('closing pipe fd ' + pipefds[1]);
	}

	pipefds[1] = -1;
	uv.nonblock(pipefds[0], 1);

	if (container.stream.type === 'NAMED_PIPE' && container.stream.ipc ) {
		flags = uv.STREAM_READABLE | uv.STREAM_WRITABLE;
	}

	else if (writable) {
		flags = uv.STREAM_WRITABLE;
	}

	else {
		flags = uv.STREAM_READABLE;
	}

	return container.stream.stream_open(pipefds[0], flags);
};


// constructs a utf16 buffer of environment
// variables block, windows require each env to be
// seperated with 1 nul and ends with 2 nul charachters
function set_env_block(env){
	if (!env){
		return;
	}

	var envBlock = process.env;

	//extend
	for (var key in envBlock){
		env.unshift(key + '=' + envBlock[key]);
	}

	var len = env.length;

	var n = "";
	for (var i = 0; i < len; i++){
		assert(syscall.putenv(env[i]) !== null);
	}
	return;
}


Process.prototype.kill = function(signum){
	var process = this;
	var err;

	if (process.process_handle == -1) {
		return errno.EINVAL;
	}

	err = uv.kill(process.pid, signum);
	if (err) return err;  /* err is already translated. */
	process.exit_signal = signum;
	return 0;
};


Process.prototype.close = function(cb){
	var self = this;
	//clear child watcher interval
	if (this.child_watcher){
		clearInterval(this.child_watcher);
	}
};

module.exports = Process;
