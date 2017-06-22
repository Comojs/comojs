module.exports = (function(platform){
	var sys     = process.binding('syscall');
	var C       = require('C');
	var assert  = require('assert');
	var errno   = require('errno');

	exports = platform.exports;
	exports.SYS = sys;

	//===========================================================
	  var Timespec                                   // STRUCT //
	//===========================================================
	= exports.Timespec
	= C.struct({
		Sec  : 'int32',
		Nsec : 'int32'
	});

	//===========================================================
	  var Stat_t                                     // STRUCT //
	//===========================================================
	= exports.Stat_t
	= C.struct({
		Dev       : 'uint64',
		X__pad1   : 'uint16',
		Pad_cgo_0 : 2, //2 bytes buffer padding
		X__st_ino : 'uint32',
		Mode      : 'uint32',
		Nlink     : 'uint32',
		Uid       : 'uint32',
		Gid       : 'uint32',
		Rdev      : 'uint64',
		X__pad2   : 'uint16',
		Pad_cgo_1 : 2, //2 bytes buffer padding
		Size      : 'int64',
		Blksize   : 'int32',
		Blocks    : 'int64',
		Atim      : exports.Timespec, //Timespec
		Mtim      : exports.Timespec, //Timespec
		Ctim      : exports.Timespec, //Timespec
		Ino       : 'uint64'
	});

	//===========================================================
	  var WinSize                                    // STRUCT //
	//===========================================================
	= exports.WinSize
	= C.struct({
		ws_row    : 'uint16',
		ws_col    : 'uint16',
		ws_xpixel : 'uint16',
		ws_ypixel : 'uint16'
	});

	var libc = exports.LoadLibrary(null);

	var kill  = libc.GetProcAddress('kill', -1, 2);
	var fcntl = libc.GetProcAddress('fcntl', -1);
	var fork = libc.GetProcAddress('fork', -1, 0);
	var dup2 = libc.GetProcAddress('dup2', -1, 2);
	var chdir = libc.GetProcAddress('chdir', -1, 1);
	var setgroups = libc.GetProcAddress('setgroups', -1, 2);
	var execlp = libc.GetProcAddress('execlp', -1, 3);
	var wait = libc.GetProcAddress('wait', -1, 1);
	var waitpid = libc.GetProcAddress('waitpid', -1, 3);
    var setenv  = libc.GetProcAddress('setenv', -1, 3);
    var putenv  = libc.GetProcAddress('putenv', -1, 1);
    var recvmsg  = libc.GetProcAddress('recvmsg', -1, 3);
    var setsid  = libc.GetProcAddress('setsid', -1, 0);
    var open  = libc.GetProcAddress('open', -1, 3);
    var getuid = libc.GetProcAddress('getuid', -1, 0);
    var setuid = libc.GetProcAddress('setuid', -1, 1);
    var isatty = libc.GetProcAddress('isatty', -1, 1);
    var getaddrinfo   = libc.GetProcAddress('getaddrinfo');
    var freeaddrinfo   = libc.GetProcAddress('freeaddrinfo');
    var ioctl   = libc.GetProcAddress('ioctl', -1);

	var pipe2;
	try {
		pipe2 = libc.GetProcAddress('pipe2', -1, 2);
	} catch (e){}

	var pipe = libc.GetProcAddress('pipe', -1, 1);

	// direct exported functions
	//===========================================================
	  exports.GetLastError = sys.GetLastError;
	  exports.kill  = sys.kill;
	  exports.fcntl = fcntl;
	  exports.fork  = fork;
	  exports.dup2  = dup2;
	  exports.chdir  = chdir;
	  exports.setgroups  = setgroups;
	  exports.execlp = execlp;
	  exports.waitpid = waitpid;
	  exports.putenv = putenv;
	  exports.recvmsg = recvmsg;
	  exports.setsid = setsid;
	  exports.setuid = setuid;
	  exports.getuid = getuid;
	  exports.getaddrinfo = getaddrinfo;
	  exports.freeaddrinfo = freeaddrinfo;
	  exports.isatty = isatty;
	  exports.ioctl = ioctl;
	//===========================================================

	// cloexec
	//===========================================================
	  exports.cloexec = function(fd, set){
	//===========================================================
		var flags = 0;
		var ret = fcntl(fd, sys.F_GETFD);
		if (ret === null) return null;

		// if cloexec flag already set do nothing
		if (!!(ret & sys.FD_CLOEXEC) == !!set) {
			return 0;
		}

		if (set) {
			flags = ret | sys.FD_CLOEXEC;
		}
		else {
			flags = ret & ~sys.FD_CLOEXEC;
		}

		ret = fcntl(fd, sys.F_SETFD, flags);
		if (ret === null) return null;
		return 1;
	};

	// return a pair of pipes, null on error
	//===========================================================
	  var pairs = new C.struct({ f : 'int', s : 'int' })();
	  exports.pipe = function(){
	//===========================================================
		if (pipe(pairs) === null) return null;
		return [pairs.f, pairs.s];
	}


	if (pipe2){
		// exports pipe2 function if supported
		//===========================================================
		  exports.pipe2 = function(flags){
		//===========================================================
			if (pipe2(pairs, flags || 0) === null) return null;
			return [pairs.f, pairs.s];
		}
	}

	// process check status
	//===========================================================
	  exports.WTERMSIG    = function(s) { return (s & 0x7f) }
	  exports.WEXITSTATUS = function(s) { return ((s) & 0xff00) >> 8 }
	  exports.WIFEXITED   = function(s)  { return !exports.WTERMSIG(s) }
	  exports.WIFSIGNALED = function(s) { return (( s & 0xffff) -1) < 0xff }
	//===========================================================


	// set environment variable
	//===========================================================
	  exports.Setenv = function(name, val){
	//===========================================================
		return setenv(name, val, 1);
	};


	exports.Open = function(file, access, perm){
		return open(file, access, perm || 0);
	}
});
