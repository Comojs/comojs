var uv      = require('uv');
var syscall = require('syscall');
var C       = require('C');
var ansi    = require('uv/tty/ansi');

var kernel  = syscall.LoadLibrary('kernel32');
var CreateEvent = kernel.GetProcAddress('CreateEventW', null, 4);
var WaitForSingleObject = kernel.GetProcAddress('WaitForSingleObject', undefined, 2);
var SetConsoleMode    = kernel.GetProcAddress('SetConsoleMode', 0, 2);
var ReadConsoleInput  = kernel.GetProcAddress('ReadConsoleInputW', 0, 4);
var WriteConsole      = kernel.GetProcAddress('WriteConsoleW', 0, 5);
var ReadConsole       = kernel.GetProcAddress('ReadConsoleW', 0, 5);

var WORD   = 'uint16';
var DWORD  = 'uint32';
var WCHAR  = 2;
var CHAR   = 1;
var UINT   = 'uint32';
var BOOL   = 'int';


var COORD = C.struct({
	X : 'int16',
	Y : 'int16'
});


var FOCUS_EVENT_RECORD = C.struct({
	bSetFocus : BOOL
});


var MOUSE_EVENT_RECORD =  C.struct({
	dwMousePosition   : COORD,
	dwButtonState     : DWORD,
	dwControlKeyState : DWORD,
	dwEventFlags      : DWORD
});


var WINDOW_BUFFER_SIZE_RECORD =  C.struct({
	dwSize : COORD
});


var MENU_EVENT_RECORD = C.struct({
	dwCommandId : UINT
});


var KEY_EVENT_RECORD = C.struct({
	bKeyDown : BOOL,
	wRepeatCount : WORD,
	wVirtualKeyCode : WORD,
	wVirtualScanCode : WORD,
	uChar : C.union ({
		UnicodeChar : WCHAR,
		AsciiChar : CHAR
	}),
	dwControlKeyState : DWORD
});


var INPUT_RECORD = C.struct({
	EventType : WORD,
	__pad : 2, // FIXME : padding on x64!!
	Event : C.union ({
		KeyEvent : KEY_EVENT_RECORD,
		MouseEvent : MOUSE_EVENT_RECORD,
		WindowBufferSizeEvent : WINDOW_BUFFER_SIZE_RECORD,
		MenuEvent  : MENU_EVENT_RECORD,
		FocusEvent : FOCUS_EVENT_RECORD
	})
});


var rDone = new C.void( C.sizeOf.uint32 );
var irec  = new INPUT_RECORD();

var ENHANCED_KEY  = 256;
var KEY_LEFT      = 37;
var KEY_UP        = 38;
var KEY_DOWN      = 40;
var KEY_RIGHT     = 39;
var KEY_HOME      = 36;
var KEY_END       = 35;
var KEY_DEL       = 46;

module.exports = function (fd, readable){
	var self = this;
	this.fd = fd;
	this.fdHandle = syscall.GetFdHandle(fd);

	if (readable){
		this.readable = true;
	}
};


uv.TTY.prototype.read_start = function(cb){
	var self = this;
	this._doread = true;
	this.read_cb = cb;
	if (!this.readable) return;
	if (this.timer) clearInterval(this.timer);
	self.timer = setInterval(function(){
		while (self._doread){
			var t = WaitForSingleObject(self.fdHandle, 0);
			if (t === 0){
				if (self.mode !== 1){
					var b = new Buffer(16 * 1024);
					var n = ReadConsole(self.fdHandle, b, 8 * 1024, rDone, null);
					self.read_cb(0, b.toString('ucs2').slice(0, rDone.uint32));
					return;
				}

				if (ReadConsoleInput (self.fdHandle, irec, 1, rDone) === null) {
					self.read_cb(process.errno);
					return;
				}

				var ev = irec.Event.KeyEvent;
				var b = '';
				if (irec.EventType === 1 && ev.bKeyDown){
					if (ev.dwControlKeyState & ENHANCED_KEY) {
						b = '\u001b';
						switch(ev.wVirtualKeyCode) {
							case KEY_DOWN  : b += '[B';  break;
							case KEY_UP    : b += '[A';  break;
							case KEY_RIGHT : b += '[C';  break;
							case KEY_LEFT  : b += '[D';  break;
							case KEY_HOME  : b += '[H';  break;
							case KEY_END   : b += '[F';  break;
							case KEY_DEL   : b += '[3~'; break;
							// default : throw new Error("unknown key type " + ev.wVirtualKeyCode);
						}
						self.read_cb(0, Buffer(b));
					} else {
						if(	ev.uChar.UnicodeChar[0] === 0) {
							// console.log(ev.wVirtualKeyCode);
						} else {
							b = ev.uChar.UnicodeChar;
						}
						self.read_cb(0, Buffer(b).toString('ucs2'));
					}
				}
			} else {
				break;
			}
		}
	}, 10);
};


uv.TTY.prototype.read_stop = function(cb){
	this._doread = false;
	if (this.timer) clearInterval(this.timer);
	this.timer = false;
};


uv.TTY.prototype.write = function(data){
	ansi.write(this.fdHandle, data);
};


uv.TTY.prototype.close = function(cb){
	this._doread = false;
	if (this.timer) clearInterval(this.timer);
	this.timer = false;
};


uv.TTY.prototype.get_winsize = function(){
	var info = new ansi.CONSOLE_SCREEN_BUFFER_INFO();
	if (ansi.GetConsoleScreenBufferInfo(this.fdHandle, info) === null){
		throw new Error("GetConsoleScreenBufferInfo " + process.errno);
	}
	var cols = info.srWindow.Right - info.srWindow.Left + 1;
	var rows = info.srWindow.Bottom - info.srWindow.Top + 1;
	return {
		width  : cols,
		height : rows
	};
};


uv.TTY.prototype.set_mode = function(mode){
	if (this.mode === mode) return;
	this.mode = mode;
	var flags = 0;
	if (mode){
		flags = 0x0008;
	} else {
		flags = 0x0004 | 0x0002 | 0x0001;
	}
	SetConsoleMode(this.fdHandle, flags);
};
