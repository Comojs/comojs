var errno = require('errno');
// reset uv_eof to negative value
errno.UV_EOF = -errno.UV_EOF;
module.exports = errno;
