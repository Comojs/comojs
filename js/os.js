var isWindows = process.platform === 'win32';

exports.EOL = isWindows ? '\r\n' : '\n';

var trailingSlashRe = isWindows ? /[^:]\\$/ : /.\/$/;

exports.tmpdir = function() {
	var path;
	if (isWindows) {
		path = process.env.TEMP ||
		  process.env.TMP ||
		  (process.env.SystemRoot || process.env.windir) + '\\temp';

	} else {
		path = process.env.TMPDIR ||
		  process.env.TMP ||
		  process.env.TEMP ||
		  '/tmp';
	}

	if (trailingSlashRe.test(path)) {
		path = path.slice(0, -1);
	}
	return path;
};
