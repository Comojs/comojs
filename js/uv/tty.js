var util     = require("util");
var stream   = require('uv/stream');
var uv       = require('uv');

util.inherits(TTY, stream);
function TTY (){
	if (uv.isWin) require('uv/tty/windows').apply(this, arguments);
	else require('uv/tty/linux').apply(this, arguments);
}

module.exports = TTY;
