var errno = require('errno');
var ERROR_MAP = {};

Object.keys(errno).forEach(function(key) {
    var val = errno[key];
    ERROR_MAP[val] = key;
    var uv_key = 'UV_' + key;
    exports[uv_key] = -val;
});

// reset uv_eof to negative value
exports.UV_EOF = -exports.UV_EOF;

exports.errname = function(err){
    if (err < 0) err = -err;
    return ERROR_MAP[err];
};
