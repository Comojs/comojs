// delete global uv if available
// this required when we are compiling with
// dukluv which exports uv as global object
delete global.uv;

var sock     = require('socket');
var posix    = process.binding('posix');
var loop     = require('loop').main;
var errno    = require('errno');
var assert   = require('assert');
var syscall  = require('syscall');
var SYS      = syscall.SYS;

var C        = require('C');
var constant = require('constants');

var isWin   = process.platform === 'win32';

exports.CLOSING              = 0x01;    /* uv_close() called but not finished. */
exports.CLOSED               = 0x02;    /* close(2) finished. */
exports.STREAM_READING       = 0x04;    /* uv_read_start() called. */
exports.STREAM_SHUTTING      = 0x08;    /* uv_shutdown() called but not complete. */
exports.STREAM_SHUT          = 0x10;    /* Write side closed. */
exports.STREAM_READABLE      = 0x20;    /* The stream is readable */
exports.STREAM_WRITABLE      = 0x40;    /* The stream is writable */
exports.STREAM_BLOCKING      = 0x80;    /* Synchronous writes. */
exports.STREAM_READ_PARTIAL  = 0x100;   /* read(2) read less than requested. */
exports.STREAM_READ_EOF      = 0x200;   /* read(2) read EOF. */
exports.TCP_NODELAY          = 0x400;   /* Disable Nagle. */
exports.TCP_KEEPALIVE        = 0x800;   /* Turn on keep-alive. */
exports.TCP_SINGLE_ACCEPT    = 0x1000;  /* Only accept() when idle. */
exports.HANDLE_IPV6          = 0x10000; /* Handle is bound to a IPv6 socket. */

exports.TCP_IPV6ONLY         = 1;

exports.IGNORE               = 0x00;
exports.CREATE_PIPE          = 0x01;
exports.INHERIT_FD           = 0x02;
exports.INHERIT_STREAM       = 0x04;
exports.PROCESS_SETUID       = (1 << 0);
exports.PROCESS_SETGID       = (1 << 1);
exports.PROCESS_DETACHED     = (1 << 3);
exports.PROCESS_WINDOWS_HIDE = (1 << 4);
exports.PROCESS_WINDOWS_VERBATIM_ARGUMENTS = (1 << 2);

exports.EOF = errno.EOF;

exports.isWin = isWin;

exports.new_timer = function(){
	return loop.handle_init(loop._handle);
};

exports.unref = function(handle){
	loop.handle_unref(handle);
};

exports.ref = function(handle){
	loop.handle_ref(handle);
};

exports.run = function(type){
	return loop.run(type);
};

exports.timer_start = function(handle, timeout, repeat, cb){
	return loop.timer_start(handle, timeout, repeat, cb);
};

exports.timer_stop = function(handle, timeout, repeat, cb){
	loop.timer_stop(handle);
};

exports.handle_close = function(handle){
	return loop.handle_close(handle);
};

exports.update_time = function(handle){
	return loop.update_time();
};


// create a socket with (domain, type, protocol) options
// the created socket will be set to nonblocking mode
// and mark as un inheritable, cloexec = 1
//===========================================================
  exports.socket = function(domain, type, protocol) {
//===========================================================
	var sockfd, err;

	if (sock.SOCK_NONBLOCK && sock.SOCK_CLOEXEC) {
		sockfd = sock.socket(domain, type | sock.SOCK_NONBLOCK | sock.SOCK_CLOEXEC, protocol);
		if (sockfd !== null) return sockfd;

		// if EINVAL error returned this may indicate
		// that SOCK_NONBLOCK or SOCK_CLOEXEC are
		// not supported, we give it another shot
		// by doing a seperate call by creating a
		// socket then set it's blocking and cloexec flags
		if (process.errno !== errno.EINVAL) return;
	}

	sockfd = sock.socket(domain, type, protocol);
	if (sockfd === null) return;

	if (!sock.nonblock(sockfd, 1)){
		sock.close(sockfd);
		return;
	}

	if (!syscall.cloexec(sockfd, 1)){
		sock.close(sockfd);
		return;
	}

	if (sock.SO_NOSIGPIPE){
		sock.setsockopt(sockfd, sock.SOL_SOCKET, sock.SO_NOSIGPIPE, 1);
	}

	return sockfd;
};


// return an ip4 packed addrerss
//===========================================================
  exports.ip4_addr = exports.ip4_address = function(ip, port){
//===========================================================
	return sock.pton4(ip, port);
};


// return an ip4 packed addrerss
//===========================================================
  exports.ip6_addr = exports.ip6_address = function(ip, port){
//===========================================================
	return sock.pton6(ip, port);
};


// either ip6 or ip4 address
//===========================================================
  exports.ip_address = exports.ip_addr = function(ip, port){
//===========================================================
	return sock.pton(ip, port);
};


//===========================================================
  exports.make_socketpair = function(fds, flags) {
//===========================================================
	var pairs = sock.winsocketpair(1);

	if (!pairs) return process.errno;
	fds[0] = pairs[0];
	fds[1] = pairs[1];

	syscall.cloexec(fds[0], 1);
	syscall.cloexec(fds[1], 1);

	if (flags & 1) {
		sock.nonblock(fds[0], 1);
		sock.nonblock(fds[1], 1);
	}

	return 0;
};

//===========================================================
  exports.make_pipe = function(fds, flags) {
//===========================================================
	var pairs;
	if (syscall.pipe2){
		pairs = syscall.pipe2(SYS.O_CLOEXEC);
		if (!pairs) return process.errno;
		fds[0] = pairs[0];
		fds[1] = pairs[1];
		return 0;
	}

	var pairs = syscall.pipe();

	if (!pairs) return process.errno;
	fds[0] = pairs[0];
	fds[1] = pairs[1];

	syscall.cloexec(fds[0], 1);
	syscall.cloexec(fds[1], 1);

	if (flags & 1) {
		sock.nonblock(fds[0], 1);
		sock.nonblock(fds[1], 1);
	}

	return 0;
};


// make fd/file handle (h) inheritable accross new
// created child processes
//===========================================================
  exports.make_inheritable = function(h){
//===========================================================
	if (!syscall.cloexec(h, 0)){
		throw new Error("can't inherit handle");
	}

	return h;
};

// generates an array container for stdio options
//===========================================================
  exports.stdio_container = function(count){
//===========================================================
	var stdio = [];
	for (var i = 0; i < count; i++){
		stdio[i] = {
			flags  : exports.IGNORE,
			stream : null,
			fd     : null
		}
	}

	return stdio;
};

// returns win32 os handle for the
// passed file descriptor
//===========================================================
  exports.get_fd_handle = function(fd){
//===========================================================
	var handle = syscall.GetFdHandle(fd);
	if (handle === null){
		throw new Error("can't get os handle for fd : " + fd);
	}

	return handle;
};


// win32 return exit code of the running process (h)
// exit code 259 indicates that the process still running
//===========================================================
  var exitCode = new C.void( C.sizeOf.int32 );
  exports.get_exit_code = function(h){
//===========================================================
	if (syscall.GetExitCodeProcess(h, exitCode) === null){
		throw new Error("GetExitCodeProcess error " + process.errno);
	}
	return exitCode.int32;
};


// close fd/handle
//===========================================================
  var _close = isWin ? syscall.CloseHandle : posix.close;
  exports.close = function(fd) {
//===========================================================
	/* Catch uninitialized io_watcher.fd bugs. */
	assert(fd > -1, "uv.close fd uninitialized");

	// FIXME: win test against stdio handles
	/* Catch stdio close bugs. */
	assert(fd > 2, "uv.close stdio file");

	var saved_errno = process.errno;
	var rc = _close(fd);

	if (rc === null) {
		rc = process.errno;
		if (rc == errno.EINTR) rc = errno.EINPROGRESS;  /* For platform/libc consistency. */
		process.errno = saved_errno;
	}

	return rc;
};


//===========================================================
  var _write = isWin ? sock.send : sock.write;
  exports.write = function(fd, buf, len, flag){
//===========================================================
	return _write(fd, buf, len);
};


//===========================================================
  var _read  = isWin ? sock.recv : sock.read;
  exports.read = function(fd, len){
//===========================================================
	return _read(fd, len);
};


// return number of pending handles
//===========================================================
  exports.pipe_pending_count = function(handle) {
//===========================================================
	if (!handle.ipc) return 0;

	if (handle.accepted_fd === -1){
		return 0;
	}

	if ( handle.queued_fds.length === 0 ){
		return 1;
	}

	return handle.queued_fds.length;
};


var STILL_ACTIVE = 259;
var Win32kill = exports.Win32kill = function(process_handle, signum){
	var status = new C.void( C.sizeOf.int32 );
	switch (signum) {
		case constant.SIGTERM:
		case constant.SIGKILL:
		case constant.SIGINT: {
			/* Unconditionally terminate the process. On Windows, killed processes */
			/* normally return 1. */
			var err;

			if (syscall.TerminateProcess(process_handle, 1)) return 0;

			/* If the process already exited before TerminateProcess was called, */
			/* TerminateProcess will fail with ERROR_ACCESS_DENIED. */
			err = syscall.GetLastError();
			if (err == errno.ERROR_ACCESS_DENIED &&
					syscall.GetExitCodeProcess(process_handle, status) &&
					status.int32 !== STILL_ACTIVE) {
				return errno.ESRCH;
			}

			return errno.translate(err);
		}

		case 0: {
			/* Health check: is the process still alive? */

			if (syscall.GetExitCodeProcess(process_handle, status) === null) {
				return errno.translate(process.errno);
			}

			if (status.int32 !== STILL_ACTIVE) {
				return errno.ESRCH;
			}

			return 0;
		}

		default: {
			/* Unsupported signal. */
			return errno.ENOSYS;
		}
	}
}

if (isWin){
	// kill process (pid) with signal (signum)
	//===========================================================
	  exports.kill = function(pid, signum) {
	//===========================================================
		var process_handle = syscall.OpenProcess(
			syscall.PROCESS_TERMINATE | syscall.PROCESS_QUERY_INFORMATION,
			0, pid
		);

		if (process_handle === null) {
			err = process.errno;
			if (err == errno.ERROR_INVALID_PARAMETER) {
				return errno.ESRCH;
			} else {
				return errno.translate(err);
			}
		}

		err = Win32kill(process_handle, signum);
		syscall.CloseHandle(process_handle);
		return err;  /* err is already translated. */
	};
} else {
	// kill process (pid) with signal (signum)
	//===========================================================
	  exports.kill = function(pid, signum) {
	//===========================================================
		if (syscall.kill(pid, signum) === null){
			return process.errno;
		}
		return 0;
	};
}

// returns pipe handle type
// TCP, NAMED_PIPE, UNKNOWN
//===========================================================
  exports.pipe_handle_type = function(handle){
//===========================================================
	if (!handle.ipc) {
		return 'UNKNOWN_HANDLE';
	}

	if (handle.accepted_fd === -1) {
		return 'UNKNOWN_HANDLE';
	}

	else {
		var fd = handle.accepted_fd;
		var sockaddr = sock.getsockname(fd);

		if (sockaddr === null) {
			return 'UNKNOWN_HANDLE';
		}

		var type = sock.getsockopt(fd, sock.SOL_SOCKET, sock.SO_TYPE);
		if (type === null) {
			return 'UNKNOWN_HANDLE';
		}

		var family = sock.family(sockaddr);
		if (family === null) {
			return 'UNKNOWN_HANDLE';
		}

		if (type === sock.SOCK_STREAM) {
			if (family === sock.AF_UNIX) {
				return 'NAMED_PIPE';
			}
			else if (family === sock.AF_INET || family === sock.AF_INET6 ){
				return 'TCP';
			}
		}

		if (type === sock.SOCK_DGRAM &&
			(family === sock.AF_INET || family === sock.AF_INET6)) {
			return 'UDP';
		}

		return 'UNKNOWN_HANDLE';
	}
};


// windows recvmsg & sendmsg emulation
// this should be moved to a seperate platform
// file ** TODO
var protobuf = C.struct({
	start  : 'uint16',
	target : 'uint32',
	pid    : 'uint32',
	handle : 'uint32',
	pad    :  1024 * 8,
	end    : 'uint16'
});


if (isWin){
	// win32 duplicate handle with same access flags
	//===========================================================
	  var pseudo_id = syscall.GetCurrentProcess();
	  exports.duplicate_handle = function(h){
	//===========================================================
		var dupHandle = new C.void( C.sizeOf.int32 );

		var ret = syscall.DuplicateHandle( pseudo_id, h, pseudo_id, dupHandle, 0, 1,
			syscall.DUPLICATE_SAME_ACCESS);

		if (ret === null){
			throw new Error("can't duplicate handle");
		}

		return dupHandle.int32;
	};


	// win32 sendmsg
	//===========================================================
	  exports.sendmsg = function(fd, buf, len, fd_to_send, pid, flag){
	//===========================================================
		var dupHandle = new C.void( C.sizeOf.int32 );
		var protoBuf  = new protobuf();
		var ret = syscall.DuplicateHandle(
			-1,
			fd_to_send,
			-1,
			dupHandle, 0, 0,
			syscall.DUPLICATE_SAME_ACCESS);

		if (ret === null){
			throw new Error("can't duplicate");
		}

		protoBuf.target = pid;
		protoBuf.pid = process.pid;
		protoBuf.handle = dupHandle.int32;

		// special message
		protoBuf.start = 123;
		protoBuf.end   = 456;

		// first send both processid and duplicated handle
		if (_write(fd, protoBuf, protoBuf.size, flag) !== protoBuf.size){
			throw new Error("error sending handle");
		}

		return _write(fd, buf, len, flag);
	};


	//===========================================================
	  var PROCESS_DUP_HANDLE = 0x0040;
	  exports.recvmsg = function(fd, len, fds){
	//===========================================================
		var dupHandle = new C.void( C.sizeOf.int32 );
		var protoBuf  = new protobuf();
		var n = sock.readIntoBuffer(fd, protoBuf, 0);
		if (n === null) return null;

		//this is not protocol buffer
		if (n !== protoBuf.size){
			return Buffer(protoBuf).slice(0, n).toString();
		}

		// maybe protocol buffer
		if (protoBuf.start === 123 && protoBuf.end === 456){
			// print('gottt protocol buffer');
			// get source process handle
			var source = syscall.OpenProcess(PROCESS_DUP_HANDLE, 0, protoBuf.pid);
			if (source === null){
				throw new Error("can't open process");
			}

			var ret = syscall.DuplicateHandle(
				source,
				protoBuf.handle,
				-1,
				dupHandle, 0, 0,
				syscall.DUPLICATE_SAME_ACCESS | syscall.DUPLICATE_CLOSE_SOURCE
			);

			if (ret === null){
				throw new Error("can't duplicate");
			}

			fds.push(dupHandle.int32);
		}
		else { // it's just a normal data sent to socket
			return Buffer(protoBuf, 0, n).toString();
		}

		return _read(fd, len);
	};
} else {
	// linux sendmsg
	//===========================================================
	  exports.sendmsg = function(fd, buf, len, fd_to_send, pid, flag){
	//===========================================================
		//send fd
		if (sock.sendfd(fd, fd_to_send) === null){
			return null;
		}
		return _write(fd, buf, len, flag);
	};

	// linux recvmsg
	//===========================================================
	  exports.recvmsg = function(fd, len, fds){
	//===========================================================
		//get fd
		var pfd = new C.void( C.sizeOf.int );
		pfd.int = -1;

		var buf = Buffer(len);
		var ret = sock.recvfd(fd, buf, pfd);
		if (ret === null){
			return null;
		}

		var nfd = pfd.int;
		if (nfd !== -1){
			exports.cloexec(nfd, 1);
			fds.push(nfd);
			if (ret === 1 && buf[0] === 0){
				return exports.recvmsg(fd, len, fds);
			}
		}

		return buf.slice(0, ret).toString();
	};
}

exports.cloexec  = syscall.cloexec;
exports.nonblock = sock.nonblock;

exports.O_RDWR  = posix.O_RDWR;
exports.open    = posix.open;


//===========================================================
  exports.TCP    = require('uv/tcp');
  exports.Pipe   = require('uv/pipe');
  exports.Stream = require('uv/stream');
  exports.TTY    = require('uv/tty');
//===========================================================

//===========================================================
  var uvProcess  = require('uv/process');
  exports.spawn  = function(options){
//===========================================================
	return new uvProcess(options);
};

if (isWin){
	exports.guess_handle = function(fd){
		var handle = syscall.GetFdHandle(fd);
		var type = syscall.GetFileType(handle);
		if (type === null){
			type = syscall.GetFileType(fd);
			if (type === null){
				return 'UNKNOWN_HANDLE';
			}
		}

		switch (type){
			case syscall.FILE_TYPE_CHAR : {
				if (syscall.GetConsoleMode(handle) !== null){
					return 'TTY';
				}
				return 'FILE'
			}
			case syscall.FILE_TYPE_DISK : {
				return 'FILE'
			}
			case syscall.FILE_TYPE_PIPE : {
				return 'TCP';
			}
		}

		return 'UNKNOWN_HANDLE';
	};
} else {
	var fs = require('fs');
	exports.guess_handle = function(fd){
		if (fd < 0) return 'UNKNOWN_HANDLE';

		// tty
		if (syscall.isatty(fd)) return 'TTY';

		var st = fs.fstatSync(fd);
		if (st.isFile()) return 'FILE';
		if (st.isFIFO()) return 'NAMED_PIPE';
		if (st.isSocket()) return 'TCP';

		return 'UNKNOWN_HANDLE';
	};
}
