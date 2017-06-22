var C       = require('C');
var syscall = require('syscall');
var kernel  = syscall.LoadLibrary('kernel32');


{	// color codes
	const FOREGROUND_BLUE       = 0x0001; // text color contains blue.
	const FOREGROUND_GREEN      = 0x0002; // text color contains green.
	const FOREGROUND_RED        = 0x0004; // text color contains red.
	const FOREGROUND_INTENSITY  = 0x0008; // text color is intensified.
	const BACKGROUND_BLUE       = 0x0010; // background color contains blue.
	const BACKGROUND_GREEN      = 0x0020; // background color contains green.
	const BACKGROUND_RED        = 0x0040; // background color contains red.
	const BACKGROUND_INTENSITY  = 0x0080; // background color is intensified.

	// masks
	const FOREGROUND_MASK       = (FOREGROUND_BLUE | FOREGROUND_GREEN | FOREGROUND_RED | FOREGROUND_INTENSITY);
	const BACKGROUND_MASK       = (BACKGROUND_BLUE | BACKGROUND_GREEN | BACKGROUND_RED | BACKGROUND_INTENSITY);

	// extended colors
	const FOREGROUND_WHITE	    = (FOREGROUND_RED | FOREGROUND_BLUE | FOREGROUND_GREEN);
	const FOREGROUND_YELLOW     = (FOREGROUND_RED | FOREGROUND_GREEN);

	const FOREGROUND_CYAN		= (FOREGROUND_BLUE | FOREGROUND_GREEN);
	const FOREGROUND_MAGENTA	= (FOREGROUND_RED | FOREGROUND_BLUE);

	const BACKGROUND_WHITE     = (BACKGROUND_RED | BACKGROUND_BLUE | BACKGROUND_GREEN);
	const BACKGROUND_YELLOW	   = (BACKGROUND_RED | BACKGROUND_GREEN);
	const BACKGROUND_CYAN      = (BACKGROUND_BLUE | BACKGROUND_GREEN);
	const BACKGROUND_MAGENTA   = (BACKGROUND_RED | BACKGROUND_BLUE);

	const FOREGROUND_BLACK     = 0;
	const BACKGROUND_BLACK     = 0;
}


var WORD = 'uint16';

var COORD = C.struct({
	X : 'int16',
	Y : 'int16'
});

var SMALL_RECT = C.struct({
	Left   : 'int16',
	Top    : 'int16',
	Right  : 'int16',
	Bottom : 'int16'
});

var CONSOLE_SCREEN_BUFFER_INFO = C.struct({
	dwSize              : COORD,
	dwCursorPosition    : COORD,
	wAttributes         : WORD,
	srWindow            : SMALL_RECT,
	dwMaximumWindowSize : COORD
});


var CHAR_INFO = C.struct({
	UnicodeChar : 2, //size of WCHAR!!
	Attributes  : WORD
});


var info = new CONSOLE_SCREEN_BUFFER_INFO();

var FillConsoleOutputAttribute = kernel.GetProcAddress('FillConsoleOutputAttribute', 0, 5);
var GetConsoleScreenBufferInfo = kernel.GetProcAddress('GetConsoleScreenBufferInfo', 0, 2);
var FillConsoleOutputCharacter = kernel.GetProcAddress('FillConsoleOutputCharacterW', 0, 5);
var ScrollConsoleScreenBuffer  = kernel.GetProcAddress('ScrollConsoleScreenBufferW', 0, 5);
var SetConsoleTextAttribute    = kernel.GetProcAddress('SetConsoleTextAttribute', 0, 2);
var SetConsoleCursorPosition   = kernel.GetProcAddress('SetConsoleCursorPosition', 0, 2);
var GetConsoleCursorInfo       = kernel.GetProcAddress('GetConsoleCursorInfo', 0, 2);
var SetConsoleCursorInfo       = kernel.GetProcAddress('SetConsoleCursorInfo', 0, 2);

var WriteConsole               = kernel.GetProcAddress('WriteConsoleW', 0, 5);


GetConsoleScreenBufferInfo(syscall.Stdout, info);
var oldattr = info.wAttributes;

function _splitArgs (str){
	return str.split(';');
}

var numberOfWritten = new C.void( C.sizeOf.uint32 );
var translateAnsiActions = {};
var empty     = new Buffer(" \0", 'ucs2');
var CHAR_BUFF = new Buffer(' ', 'ucs2');

// ESC[#J
translateAnsiActions.J   = function(args, cHandle, info, pos){
	var len = 0;
	// ESC[0J Erase from the cursor to the end of the screen.
	if (args[0] == 0){
		pos.X = info.dwCursorPosition.X;
		pos.Y = info.dwCursorPosition.Y;

		len = (info.dwSize.Y - info.dwCursorPosition.Y - 1) * info.dwSize.X
			+ info.dwSize.X - info.dwCursorPosition.X - 1;

		FillConsoleOutputCharacter( cHandle, C.address(empty), len, C.address(pos), numberOfWritten );
		FillConsoleOutputAttribute( cHandle, info.wAttributes, len, C.address(pos), numberOfWritten );
	}
	// ESC[1J erase from start to cursor.
	else if (args[0] == 1){
		pos.X = 0;
		pos.Y = 0;
		len   = info.dwCursorPosition.Y * info.dwSize.X
			+ info.dwCursorPosition.X + 1;

		FillConsoleOutputCharacter( cHandle, C.address(empty), len, C.address(pos), numberOfWritten );
		FillConsoleOutputAttribute( cHandle, info.wAttributes, len, C.address(pos), numberOfWritten );
	}
	// ESC[2J 	clear screen and home cursor
	else if (args[0] == 2){
		pos.X = 0;
		pos.Y = 0;
		len   = info.dwSize.X * info.dwSize.Y;

		FillConsoleOutputCharacter( cHandle, C.address(empty), len, C.address(pos), numberOfWritten );
		FillConsoleOutputAttribute( cHandle, info.wAttributes, len, C.address(pos), numberOfWritten );
		SetConsoleCursorPosition( cHandle,  C.address(pos));
	}
};


// ESC[#X Erase # characters.
translateAnsiActions.X = function(args, cHandle, info, pos){
	var val = (args[0] | 0) || 1;
	FillConsoleOutputCharacter( cHandle, C.address(empty), val,
		C.address(info.dwCursorPosition),
		numberOfWritten );

	FillConsoleOutputAttribute( cHandle, info.wAttributes, val,
		C.address(info.dwCursorPosition),
		numberOfWritten );
};


// ESC[#L Insert # blank lines.
translateAnsiActions.L = function(args, cHandle, info, pos){
	var val = (args[0] | 0) || 1;
	var Rect = new SMALL_RECT();
	var CharInfo = new CHAR_INFO();

	Rect.Left   = 0;
	Rect.Top    = info.dwCursorPosition.Y;
	Rect.Right  = info.dwSize.X - 1;
	Rect.Bottom = info.dwSize.Y - 1;

	pos.X = 0;
	pos.Y = info.dwCursorPosition.Y + val;

	CharInfo.UnicodeChar = CHAR_BUFF;
	CharInfo.Attributes  = info.wAttributes;
	ScrollConsoleScreenBuffer( cHandle, Rect, null, C.address(pos), CharInfo );
};

// ESC[#M Delete # lines.
translateAnsiActions.M = function(args, cHandle, info, pos){
	var val = (args[0] | 0) || 1;
	var Rect = new SMALL_RECT();
	var CharInfo = new CHAR_INFO();

	if (val > info.dwSize.Y - info.dwCursorPosition.Y) {
		val = info.dwSize.Y - info.dwCursorPosition.Y;
	}

	Rect.Left   = 0;
	Rect.Top    = info.dwCursorPosition.Y + val;
	Rect.Right  = info.dwSize.X - 1;
	Rect.Bottom = info.dwSize.Y - 1;

	pos.X = 0;
	pos.Y = info.dwCursorPosition.Y;

	CharInfo.UnicodeChar = CHAR_BUFF;
	CharInfo.Attributes  = info.wAttributes;
	ScrollConsoleScreenBuffer( cHandle, Rect, null, C.address(pos), CharInfo );
};


// ESC[#P Delete # characters.
translateAnsiActions.P = function(args, cHandle, info, pos){
	var val = (args[0] | 0) || 1;
	var Rect = new SMALL_RECT();
	var CharInfo = new CHAR_INFO();

	if (info.dwCursorPosition.X + val > info.dwSize.X - 1) {
		val = info.dwSize.X - info.dwCursorPosition.X;
	}

	Rect.Left   = info.dwCursorPosition.X + val;
	Rect.Top    = info.dwCursorPosition.Y;
	Rect.Right  = info.dwSize.X - 1;
	Rect.Bottom = info.dwCursorPosition.Y;

	CharInfo.UnicodeChar = CHAR_BUFF;
	CharInfo.Attributes  = info.wAttributes;
	ScrollConsoleScreenBuffer( cHandle, Rect, null, info.dwCursorPosition, CharInfo );
};


 // ESC[#@ Insert # blank characters.
translateAnsiActions['@'] = function(args, cHandle, info, pos){
	var val = (args[0] | 0) || 1;
	var Rect = new SMALL_RECT();
	var CharInfo = new CHAR_INFO();

	if (info.dwCursorPosition.X + val > info.dwSize.X - 1) {
		val = info.dwSize.X - info.dwCursorPosition.X;
	}

	Rect.Left   = info.dwCursorPosition.X;
	Rect.Top    = info.dwCursorPosition.Y;
	Rect.Right  = info.dwSize.X - 1 - val;
	Rect.Bottom = info.dwCursorPosition.Y;

	pos.X = info.dwCursorPosition.X + val;
	pos.Y = info.dwCursorPosition.Y;

	CharInfo.UnicodeChar = CHAR_BUFF;
	CharInfo.Attributes = info.wAttributes;
	ScrollConsoleScreenBuffer( cHandle, Rect, null, C.address(pos), CharInfo );
};


// ESC[#A
// ESC[#k  - Moves cursor up # lines
translateAnsiActions.A =
translateAnsiActions.k = function(args, cHandle, info, pos){
	var val = (args[0] | 0) || 1;
	pos.Y = info.dwCursorPosition.Y - val;
	if (pos.Y < 0) pos.Y = 0;
	pos.X = info.dwCursorPosition.X;
	SetConsoleCursorPosition( cHandle, C.address(pos) );
};


// ESC[#B
// ESC[#e Moves cursor down # lines
translateAnsiActions.B =
translateAnsiActions.e = function(args, cHandle, info, pos){
	var val = (args[0] | 0) || 1;
	pos.Y = info.dwCursorPosition.Y + val;
	if (pos.Y >= info.dwSize.Y) pos.Y = info.dwSize.Y - 1;
	pos.X = info.dwCursorPosition.X;
	SetConsoleCursorPosition( cHandle, C.address(pos) );
};



// ESC[#C
// ESC[#a Moves cursor forward # spaces
translateAnsiActions.C =
translateAnsiActions.a = function(args, cHandle, info, pos){
	var val = (args[0] | 0) || 1;
	pos.X = info.dwCursorPosition.X + val;
	if (pos.X >= info.dwSize.X) pos.X = info.dwSize.X - 1;
	pos.Y = info.dwCursorPosition.Y;
	SetConsoleCursorPosition( cHandle, C.address(pos) );
};


// ESC[#j
// ESC[#D Moves cursor back # spaces
translateAnsiActions.D =
translateAnsiActions.j = function(args, cHandle, info, pos){
	var val = (args[0] | 0) || 1;
	pos.X = info.dwCursorPosition.X - val;
	if (pos.X < 0) pos.X = 0;
	pos.Y = info.dwCursorPosition.Y;
	SetConsoleCursorPosition( cHandle, C.address(pos) );
};



// ESC[#E Moves cursor down # lines, column 1.
translateAnsiActions.E = function(args, cHandle, info, pos){
	var val = (args[0] | 0) || 1;
	pos.Y = info.dwCursorPosition.Y + val;
	if (pos.Y >= info.dwSize.Y) pos.Y = info.dwSize.Y - 1;
	pos.X = 0;
	SetConsoleCursorPosition( cHandle, C.address(pos) );
};


// ESC[#F Moves cursor up # lines, column 1.
translateAnsiActions.F = function(args, cHandle, info, pos){
	var val = (args[0] | 0) || 1;
	pos.Y = info.dwCursorPosition.Y - val;
	if (pos.Y < 0) pos.Y = 0;
	pos.X = 0;
	SetConsoleCursorPosition( cHandle, C.address(pos) );
};


// ESC[#`
// ESC[#G Moves cursor column # in current row.
translateAnsiActions.G    =
translateAnsiActions['`'] = function(args, cHandle, info, pos){
	var val = (args[0] | 0) || 1;
	pos.X = val - 1;
	if (pos.X >= info.dwSize.X) pos.X = info.dwSize.X - 1;
	if (pos.X < 0) pos.X = 0;
	pos.Y = info.dwCursorPosition.Y;
	SetConsoleCursorPosition( cHandle, C.address(pos) );
};


// ESC[#d Moves cursor row #, current column.
translateAnsiActions.d = function(args, cHandle, info, pos){
	var val  = (args[0] | 0) || 1;
	pos.Y = val - 1;
	if (pos.Y < 0) pos.Y = 0;
	if (pos.Y >= info.dwSize.Y) pos.Y = info.dwSize.Y - 1;
	SetConsoleCursorPosition( cHandle, C.address(pos) );
};


// ESC[#;#f
// ESC[#;#H Moves cursor to line #, column #
translateAnsiActions.f =
translateAnsiActions.H = function(args, cHandle, info, pos){
	var val  = (args[0] | 0) || 1;
	var val2 = (args[1] | 0) || 1;

	if (args.length > 2) return;
	pos.X = val2 - 1;
	if (pos.X < 0) pos.X = 0;
	if (pos.X >= info.dwSize.X) pos.X = info.dwSize.X - 1;
	pos.Y = val - 1;
	if (pos.Y < 0) pos.Y = 0;
	if (pos.Y >= info.dwSize.Y) pos.Y = info.dwSize.Y - 1;
	SetConsoleCursorPosition( cHandle, C.address(pos) );
};


// ESC[s Saves cursor position for recall later
var SavePos = new COORD();
translateAnsiActions.s = function(args, cHandle, info, pos){
	SavePos.X = info.dwCursorPosition.X;
	SavePos.Y = info.dwCursorPosition.Y;
};


// ESC[u Return to saved cursor position
translateAnsiActions.u = function(args, cHandle, info, pos){
	SetConsoleCursorPosition( cHandle, C.address(SavePos) );
};


translateAnsiActions.m   = function(args, cHandle, info, pos){
	for (var i = 0; i < args.length; i++){
		var val = args[i] | 0;
		var attr = info.wAttributes;
		if (val === 0){
			SetConsoleTextAttribute(cHandle, oldattr);
			return;
		}
		// forground color
		if (val >= 30 && val <= 37){
			attr = (attr & BACKGROUND_MASK);
			if ( ((val - 30) & 1) !== 0 ){
				attr |= FOREGROUND_RED;
			}
			if ( ((val - 30) & 2) !== 0 ){
				attr |= FOREGROUND_GREEN;
			}
			if ( ((val - 30) & 4) !== 0 ) {
				attr |= FOREGROUND_BLUE;
			}
		}
		// reset forground color
		else if (val === 39){
			attr &= BACKGROUND_MASK;
			attr |= oldattr & FOREGROUND_MASK;
		}
		// background color
		else if (val >= 40 && val <= 47){
			attr = (attr & FOREGROUND_MASK)
			if ( ((val - 40) & 1) !== 0 ) {
				attr |= BACKGROUND_GREEN;
			}
			if ( ((val - 40) & 2 ) !== 0 ) {
				attr |= BACKGROUND_GREEN;
			}
			if ( ((val - 40) & 4 ) !== 0 ) {
				attr |= BACKGROUND_BLUE;
			}
		}
		// reset background
		else if (val === 49){
			attr &= FOREGROUND_MASK;
			attr |= w.oldattr & BACKGROUND_MASK;
		}
		SetConsoleTextAttribute(cHandle, attr);
	}
};


function _write_string (cHandle, str){
	var utf16Buffer = new Buffer(str + '\0', 'ucs2');
	var ret = WriteConsole(cHandle, utf16Buffer, str.length, numberOfWritten, null);
	if (ret === null){
		throw new Error(process.errno);
	}
}


var coord = new COORD();
var ansiParserRegex = /([\s\S]*?)\x1b\[([\s\S]*?)([\?|\`|\@|a-zA-Z])/g;
function write (stdHandle, str){
	var match;
	var matched = 0;
	while (match = ansiParserRegex.exec(str)) {
		matched += match[0].length;
		var stringToWrite = match[1];
		var suffix        = match[3];
		if (stringToWrite) {
			_write_string(stdHandle, stringToWrite);
		};

		if (translateAnsiActions[suffix]){
			// get current screen buffer info and pass it
			// to translateansi action we need to use it
			if (GetConsoleScreenBufferInfo(stdHandle, info) === null){
				throw new Error("can't get console buffer info");
			}

			var args = _splitArgs(match[2]);
			translateAnsiActions[suffix]( args,
				stdHandle /* console handle */,
				info, /* console buffer info */
				coord /* coord struct for position */);
		}
	}

	// nothing matched at all, the whole string
	// doesn't contain ansi escape sequence
	if (!matched){
		_write_string(stdHandle, str);
	} else {
		// matched but normal string left without
		// writing at the end
		if (str.length > matched){
			_write_string(stdHandle, str.slice(matched, str.length));
		}
	}
}

exports.write = write;

// TODO move all structs and win API functions to syscall
exports.GetConsoleScreenBufferInfo = GetConsoleScreenBufferInfo;
exports.CONSOLE_SCREEN_BUFFER_INFO = CONSOLE_SCREEN_BUFFER_INFO;
