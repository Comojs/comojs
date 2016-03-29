module.exports = (function(platform){
	var binding = process.binding('syscall');
	var assert  = require('assert');
	var errno   = require('errno');
	var C       = require('C');
	// var utf16   = require('../go/unicode/utf16');

	var syscall = exports = platform.exports;

	{	// Invented values to support what package os expects.
		var O_RDONLY   = exports.O_RDONLY   = 0x00000;
		var O_WRONLY   = exports.O_WRONLY   = 0x00001;
		var O_RDWR     = exports.O_RDWR     = 0x00002;
		var O_CREAT    = exports.O_CREAT    = 0x00040;
		var O_EXCL     = exports.O_EXCL     = 0x00080;
		var O_NOCTTY   = exports.O_NOCTTY   = 0x00100;
		var O_TRUNC    = exports.O_TRUNC    = 0x00200;
		var O_NONBLOCK = exports.O_NONBLOCK = 0x00800;
		var O_APPEND   = exports.O_APPEND   = 0x00400;
		var O_SYNC     = exports.O_SYNC     = 0x01000;
		var O_ASYNC    = exports.O_ASYNC    = 0x02000;
		var O_CLOEXEC  = exports.O_CLOEXEC  = 0x80000;
	}

	{
		GENERIC_READ    = 0x80000000
		GENERIC_WRITE   = 0x40000000
		GENERIC_EXECUTE = 0x20000000
		GENERIC_ALL     = 0x10000000

		FILE_LIST_DIRECTORY   = 0x00000001
		FILE_APPEND_DATA      = 0x00000004
		FILE_WRITE_ATTRIBUTES = 0x00000100

		FILE_SHARE_READ              = 0x00000001
		FILE_SHARE_WRITE             = 0x00000002
		FILE_SHARE_DELETE            = 0x00000004
		FILE_ATTRIBUTE_READONLY      = 0x00000001
		FILE_ATTRIBUTE_HIDDEN        = 0x00000002
		FILE_ATTRIBUTE_SYSTEM        = 0x00000004
		FILE_ATTRIBUTE_DIRECTORY     = 0x00000010
		FILE_ATTRIBUTE_ARCHIVE       = 0x00000020
		FILE_ATTRIBUTE_NORMAL        = 0x00000080
		FILE_ATTRIBUTE_REPARSE_POINT = 0x00000400

		INVALID_FILE_ATTRIBUTES = 0xffffffff

		CREATE_NEW        = 1
		CREATE_ALWAYS     = 2
		OPEN_EXISTING     = 3
		OPEN_ALWAYS       = 4
		TRUNCATE_EXISTING = 5

		FILE_FLAG_OPEN_REPARSE_POINT = 0x00200000
		FILE_FLAG_BACKUP_SEMANTICS   = 0x02000000
		FILE_FLAG_OVERLAPPED         = 0x40000000

		exports.HANDLE_FLAG_INHERIT    = 0x00000001
		exports.STARTF_USESTDHANDLES   = 0x00000100
		exports.STARTF_USESHOWWINDOW   = 0x00000001
		exports.DUPLICATE_CLOSE_SOURCE = 0x00000001
		exports.DUPLICATE_SAME_ACCESS  = 0x00000002

		STD_INPUT_HANDLE  = -10
		STD_OUTPUT_HANDLE = -11
		STD_ERROR_HANDLE  = -12

		FILE_BEGIN   = 0
		FILE_CURRENT = 1
		FILE_END     = 2

		LANG_ENGLISH       = 0x09
		SUBLANG_ENGLISH_US = 0x01

		FORMAT_MESSAGE_ALLOCATE_BUFFER = 256
		FORMAT_MESSAGE_IGNORE_INSERTS  = 512
		FORMAT_MESSAGE_FROM_STRING     = 1024
		FORMAT_MESSAGE_FROM_HMODULE    = 2048
		FORMAT_MESSAGE_FROM_SYSTEM     = 4096
		FORMAT_MESSAGE_ARGUMENT_ARRAY  = 8192
		FORMAT_MESSAGE_MAX_WIDTH_MASK  = 255

		MAX_PATH      = 260
		MAX_LONG_PATH = 32768

		MAX_COMPUTERNAME_LENGTH = 15

		TIME_ZONE_ID_UNKNOWN  = 0
		TIME_ZONE_ID_STANDARD = 1

		TIME_ZONE_ID_DAYLIGHT = 2
		IGNORE                = 0
		INFINITE              = 0xffffffff

		WAIT_TIMEOUT   = 258
		WAIT_ABANDONED = 0x00000080
		WAIT_OBJECT_0  = 0x00000000
		WAIT_FAILED    = 0xFFFFFFFF

		CREATE_NEW_PROCESS_GROUP   = 0x00000200
		CREATE_UNICODE_ENVIRONMENT = 0x00000400

		exports.PROCESS_TERMINATE         = 1
		exports.PROCESS_QUERY_INFORMATION = 0x00000400
		exports.SYNCHRONIZE               = 0x00100000

		PAGE_READONLY          = 0x02
		PAGE_READWRITE         = 0x04
		PAGE_WRITECOPY         = 0x08
		PAGE_EXECUTE_READ      = 0x20
		PAGE_EXECUTE_READWRITE = 0x40
		PAGE_EXECUTE_WRITECOPY = 0x80

		FILE_MAP_COPY    = 0x01
		FILE_MAP_WRITE   = 0x02
		FILE_MAP_READ    = 0x04
		FILE_MAP_EXECUTE = 0x20

		CTRL_C_EVENT     = 0
		CTRL_BREAK_EVENT = 1
	}

	{	//File types
		FILE_TYPE_CHAR    = 0x0002
		FILE_TYPE_DISK    = 0x0001
		FILE_TYPE_PIPE    = 0x0003
		FILE_TYPE_REMOTE  = 0x8000
		FILE_TYPE_UNKNOWN = 0x0000
	}


	{	// ShowWindow constants
		// winuser.h
		exports.SW_HIDE            = 0
		SW_NORMAL          = 1
		SW_SHOWNORMAL      = 1
		exports.SW_SHOWMINIMIZED   = 2
		SW_SHOWMAXIMIZED   = 3
		SW_MAXIMIZE        = 3
		SW_SHOWNOACTIVATE  = 4
		SW_SHOW            = 5
		SW_MINIMIZE        = 6
		SW_SHOWMINNOACTIVE = 7
		SW_SHOWNA          = 8
		SW_RESTORE         = 9
		exports.SW_SHOWDEFAULT     = 10
		SW_FORCEMINIMIZE   = 11
	}

	var WORD   = 'uint16';
	var DWORD  = 'uint32';
	var HANDLE = 'uint32';
	var ULONG  = 'uint32';

	//===========================================================
		var Overlapped                               // STRUCT //
	//===========================================================
	= exports.Overlapped
	= C.Struct.create({
		Internal     : ULONG,
		InternalHigh : ULONG,
		Offset       : 'uint32',
		OffsetHigh   : 'uint32',
		HEvent       : HANDLE
	});


	//===========================================================
		var Filetime                                 // STRUCT //
	//===========================================================
	= exports.Filetime
	= C.Struct.create({
		LowDateTime  : DWORD,
		HighDateTime : DWORD
	});


	//===========================================================
		var ByHandleFileInformation                  // STRUCT //
	//===========================================================
	= exports.ByHandleFileInformation
	= C.Struct.create({
		FileAttributes      : DWORD,
		CreationTime        : exports.Filetime,
		LastAccessTime      : exports.Filetime,
		LastWriteTime       : exports.Filetime,
		VolumeSerialNumber  : DWORD,
		FileSizeHigh        : DWORD,
		FileSizeLow         : DWORD,
		NumberOfLinks       : DWORD,
		FileIndexHigh       : DWORD,
		FileIndexLow        : DWORD
	});


	//===========================================================
		var Win32FileAttributeData                   // STRUCT //
	//===========================================================
	= exports.Win32FileAttributeData
	= C.Struct.create({
		FileAttributes : 'uint32',
		CreationTime   : exports.Filetime,
		LastAccessTime : exports.Filetime,
		LastWriteTime  : exports.Filetime,
		FileSizeHigh   : 'uint32',
		FileSizeLow    : 'uint32'
	});


	//===========================================================
		var SystemTime                               // STRUCT //
	//===========================================================
	= exports.SystemTime
	= C.Struct.create({
		Year         : WORD,
		Month        : WORD,
		DayOfWeek    : WORD,
		Day          : WORD,
		Hour         : WORD,
		Minute       : WORD,
		Second       : WORD,
		Milliseconds : WORD
	});

	//===========================================================
		var SecurityAttributes                       // STRUCT //
	//===========================================================
	= exports.SecurityAttributes
	= C.Struct.create ({
		Length             : 'uint32',
		SecurityDescriptor : 'uint32',
		InheritHandle      : 'uint32'
	});


	//===========================================================
		var StartupInfo                              // STRUCT //
	//===========================================================
	= exports.StartupInfo
	= C.Struct.create({
		Cb            : 'uint32',
		Reserved1     : '*',
		Desktop       : '*',
		Title         : '*',
		X             : 'uint32',
		Y             : 'uint32',
		XSize         : 'uint32',
		YSize         : 'uint32',
		XCountChars   : 'uint32',
		YCountChars   : 'uint32',
		FillAttribute : 'uint32',
		Flags         : 'uint32',
		ShowWindow    : 'uint16',
		Reserved2     : 'uint16',
		Reserved3     : '*',
		StdInput      : HANDLE,
		StdOutput     : HANDLE,
		StdError      : HANDLE
	});

	//===========================================================
		var ProcessInformation                       // STRUCT //
	//===========================================================
	= exports.ProcessInformation
	= C.Struct.create({
		Process   : HANDLE,
		Thread    : HANDLE,
		ProcessId : 'uint32',
		ThreadId  : 'uint32'
	});

	//kernel32 library
	var kernel       = exports.LoadLibrary('kernel32');
	var ws2          = exports.LoadLibrary('Ws2_32');
	exports.WSADuplicateSocket = ws2.GetProcAddress('WSADuplicateSocketW', -1, 3);
	exports.WSASocket = ws2.GetProcAddress('WSASocketW');
	exports.WSAGetLastError = ws2.GetProcAddress('WSAGetLastError');

	exports.getaddrinfo   = ws2.GetProcAddress('getaddrinfo', null, 4);
	exports.freeaddrinfo  = ws2.GetProcAddress('freeaddrinfo');

	GetLastError     = kernel.GetProcAddress('GetLastError');

	// functions with failure value of -1.
	var GetStdHandle = kernel.GetProcAddress('GetStdHandle', -1);
	var CreateFile   = kernel.GetProcAddress('CreateFileW', -1);

	var ReadFile      = kernel.GetProcAddress('ReadFile', 0);
	var WriteFile     = kernel.GetProcAddress('WriteFile', 0);
	var GetTempPath   = kernel.GetProcAddress('GetTempPathW');
	var WriteConsole  = kernel.GetProcAddress('WriteConsoleW');
	var GetFileType   = kernel.GetProcAddress('GetFileType', 0);

	var SetHandleInformation = kernel.GetProcAddress('SetHandleInformation', 0);
	var GetFileInformationByHandle = kernel.GetProcAddress('GetFileInformationByHandle', 0);
	var DuplicateHandle = kernel.GetProcAddress('DuplicateHandle', 0);
	var GetCurrentProcess = kernel.GetProcAddress('GetCurrentProcess');
	var GetCurrentProcessId = kernel.GetProcAddress('GetCurrentProcessId');
	var FileTimeToSystemTime = kernel.GetProcAddress('FileTimeToSystemTime', 0, 2);
	var OpenProcess    = kernel.GetProcAddress('OpenProcess', 0);
	var TerminateProcess   = kernel.GetProcAddress('TerminateProcess', 0, 2);
	var CreateProcess    = kernel.GetProcAddress('CreateProcessW', 0);
	var CloseHandle    = kernel.GetProcAddress('CloseHandle', 0);
	var GetExitCodeProcess = kernel.GetProcAddress('GetExitCodeProcess', 0);
	var GetCurrentDirectory =  kernel.GetProcAddress('GetCurrentDirectoryW', 0);
	var GetEnvironmentVariable =  kernel.GetProcAddress('GetEnvironmentVariableW', 0);
	var CreatePipe = kernel.GetProcAddress('CreatePipe', 0);

	// exported raw syscall functions
	//===========================================================
	  exports.GetLastError = GetLastError;
	  exports.CloseOnExec = CloseOnExec;
	  exports.DuplicateHandle = DuplicateHandle;
	  exports.GetCurrentProcess = GetCurrentProcess;
	  exports.GetCurrentProcessId = GetCurrentProcessId;

	  exports.OpenProcess     = OpenProcess;
	  exports.TerminateProcess  = TerminateProcess;
	  exports.CreateProcess     = CreateProcess;
	  exports.CloseHandle = CloseHandle;
	  exports.GetExitCodeProcess = GetExitCodeProcess;

	  exports.GetFdHandle = binding.GetFdHandle;
	  exports.GetHandleFd = binding.GetHandleFd;

	  exports.UTF16PtrFromString = UTF16PtrFromString;

	  exports.WriteFile = WriteFile;
	  exports.GetFileInformationByHandle = GetFileInformationByHandle;
	  exports.FileTimeToSystemTime  = FileTimeToSystemTime;
	//===========================================================


	// STDIO handles
	//===========================================================
	  exports.Stdin  = getStdHandle(STD_INPUT_HANDLE);
	  exports.Stdout = getStdHandle(STD_OUTPUT_HANDLE);
	  exports.Stderr = getStdHandle(STD_ERROR_HANDLE);
	//===========================================================


	function _kill(handle, signum){

	}

	exports.kill = function(pid, signum) {

		var process_handle = OpenProcess(
			PROCESS_TERMINATE | PROCESS_QUERY_INFORMATION,
			0, pid
		);

		if (process_handle === null) {
			err = process.errno;
			if (err == errno.ERROR_INVALID_PARAMETER) {
				return errno.ESRCH;
			} else {
				return uv_translate_sys_error(err);
			}
		}

		err = _kill(process_handle, signum);
		CloseHandle(process_handle);
		return err;  /* err is already translated. */
	};


	function CloseOnExec(fd) {
		return SetHandleInformation(fd, exports.HANDLE_FLAG_INHERIT, 0);
	}


	function getStdHandle(h){
		var r = GetStdHandle(h);
		if (r === null) return null;
		CloseOnExec(r);
		return r;
	}


	function UTF16PtrFromString (s){
		s = s + '\0'; //nul terminated string
		return new Buffer(s, 'ucs2');
		// return utf16.Encode(rune(s + "\x00"));
	}


	// SetFilePointer return value is not as other win32 functions
	// on failure it returns INVALID_SET_FILE_POINTER  0xffffffff
	// we could define this error as GetProcAddress 2nd argument
	// but for clarification we created a whole function
	var _SetFilePointer  = kernel.GetProcAddress('SetFilePointer');
	function SetFilePointer(handle, lowoffset, highoffsetptr, whence) {
		var newlowoffset = _SetFilePointer(handle, lowoffset, highoffsetptr, whence);
		if (newlowoffset === 0xffffffff) {
			process.errno = GetLastError() || errno.EINVAL;
			return null;
		}
		return newlowoffset;
	}


	// returns a utf16 buffer to the current working directory
	//===========================================================
	  exports.GetCurrentDirectory = function() {
	//===========================================================

		// first need get the current directory length
		var buf_length = GetCurrentDirectory(0, null);
		if (!buf_length) return null;

		var buf = new Buffer(buf_length * 2);

		var ret = GetCurrentDirectory(buf.byteLength, buf);
		if (ret === null){
			throw new Error(process.errno);
		}
		return buf;
	};


	// returns string value of environment variable (v)
	//===========================================================
	  exports.Getenv = function(v) {
	//===========================================================
		var vUTF16 = UTF16PtrFromString(v);

		var n = 200;

		// we first try with small buffer
		// if the return value exceeds our initial
		// buffer length we go through the loop
		// again and allocate a new buffer with the
		// exact length of charcters returned
		while (1){
			var buf = new Buffer(n);
			var len = buf.byteLength;

			n = GetEnvironmentVariable(vUTF16, buf, len);
			if (n === null){
				if (process.errno === errno.ERROR_ENVVAR_NOT_FOUND){
					return "";
				}

				throw new Error(process.errno);
			}

			if (n <= len){
				return buf.toString('ucs2').slice(0, n);
			}
			n *= 2;
		}
	};


	// enable disable file handle inheritance
	// in new created child processes
	//===========================================================
	  exports.cloexec = function(fd, close){
	//===========================================================
		var n = close ? 0 : 1;
		return SetHandleInformation(fd, exports.HANDLE_FLAG_INHERIT, n);
	};


	// open file with mode and permission
	// on success returns file handle opened
	// on error returns null and set process.errno
	// with the last syscall error
	//===========================================================
	  exports.Open = function(path, mode, perm) {
	//===========================================================
		assert(typeof path === 'string', "path must be a string");

		if (path.length === 0) {
			process.errno = ERROR_FILE_NOT_FOUND;
			return null;
		}

		var pathp = UTF16PtrFromString(path);
		if (pathp == null) { //return null as this already set errno
			return null;
		}

		var access = 0;
		switch (mode & (O_RDONLY | O_WRONLY | O_RDWR)) {
			case O_RDONLY:
				access = GENERIC_READ; break;
			case O_WRONLY:
				access = GENERIC_WRITE; break;
			case O_RDWR:
				access = GENERIC_READ | GENERIC_WRITE; break;
		}

		if ( (mode & O_CREAT) != 0 ) {
			access |= GENERIC_WRITE;
		}

		if ( (mode & O_APPEND) != 0 ) {
			access &= ~GENERIC_WRITE;
			access |= FILE_APPEND_DATA;
		}

		var sharemode = FILE_SHARE_READ | FILE_SHARE_WRITE;
		var sa = SecurityAttributes();

		//if no O_CLOEXEC flag make this handle inheritable
		if ( (mode & O_CLOEXEC) == 0 ) {
			// sa = makeInheritSa();
		}

		var createmode = 0;

		{	/*  file creation mode */
			if ((mode & (O_CREAT | O_EXCL)) === (O_CREAT | O_EXCL)) {
				createmode = CREATE_NEW;
			}

			else if ((mode & (O_CREAT|O_TRUNC)) == (O_CREAT | O_TRUNC)){
				createmode = CREATE_ALWAYS;
			}

			else if ( (mode & O_CREAT) == O_CREAT ) {
				createmode = OPEN_ALWAYS;
			}

			else if ((mode & O_TRUNC) == O_TRUNC){
				createmode = TRUNCATE_EXISTING;
			}

			else {
				createmode = OPEN_EXISTING;
			}
		}

		var h = CreateFile(pathp, access, sharemode, sa, createmode, FILE_ATTRIBUTE_NORMAL, 0);
		return h;
	};


	// Read file (fd) into buffer (b)
	// on success returns number of read bytes
	// on error returns null and set process.errno
	// to the last syscall error
	//===========================================================
	  var rDone = new C.void( C.sizeOf.uint32 );
	  exports.Read = function(fd, b) {
	//===========================================================
		var e = ReadFile(fd, b, b.byteLength, rDone, null);
		if (e === null) return e;
		return rDone.uint32;
	};


	// Write data from buffer (b) into file fd
	// return null on failure and number of written data
	// on success
	//===========================================================
	  var wDone = new C.void( C.sizeOf.uint32 );
	  exports.Write = function(fd, b) {
	//===========================================================
		var e = WriteFile(fd, b, b.byteLength, wDone, null);
		if (e === null) return null;
		return wDone.uint32;
	};


	//===========================================================
	  exports.Seek = function(fd, offset, whence) {
	//===========================================================
		var w = 0;
		switch (whence) {
			case 0:
				w = FILE_BEGIN; break;
			case 1:
				w = FILE_CURRENT; break;
			case 2:
				w = FILE_END; break;
			deafult: throw new Error('unknown file seek whence');
		}

		var hi = new C.void( C.sizeOf.uint32 );
		hi.uint32 = offset.RShift(32); // offset >> 32

		var lo = offset;
		// use GetFileType to check pipe, pipe can't do seek
		var ft = GetFileType(fd);
		if (ft == FILE_TYPE_PIPE) {
			process.errno = errno.EPIPE;
			return null;
		}

		var rlo = SetFilePointer(fd, lo, hi, w);
		if (rlo === null) return null;

		//(hi << 32) + rlo
		return ( hi.uint32.LShift(32) ) + rlo;
	};
});
