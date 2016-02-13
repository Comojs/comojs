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

module.exports = errno;
