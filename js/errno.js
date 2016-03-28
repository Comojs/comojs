var errno = process.binding('errno');
var _toString = errno.toString;

errno.toString = function(errno){
	if (errno < 0) errno = -errno;
	return _toString(errno);
};

// windows specific errors
errno.ERROR_ENVVAR_NOT_FOUND        = 203;
errno.ERROR_INVALID_PARAMETER       = 87;
errno.ERROR_ACCESS_DENIED           = 5;

var ERROR_MAP = {};
Object.keys(errno).forEach(function(key) {
    var val = errno[key];
    if (typeof val === 'function') return;
    ERROR_MAP[val] = key;
    var uv_key = 'UV_' + key;
    errno[uv_key] = -val;
});

errno.errname = function(err){
    if (err < 0) err = -err;
    return ERROR_MAP[err];
};

module.exports = errno;
