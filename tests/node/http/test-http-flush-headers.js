'use strict';
var common = require('../common');
var assert = require('assert');
var http = require('http');

var server = http.createServer();
server.on('request', function(req, res) {
  assert.equal(req.headers['foo'], 'bar');
  res.end('ok');
  server.close();
});
server.listen(common.PORT, '127.0.0.1', function() {
  var req = http.request({
    method: 'GET',
    host: '127.0.0.1',
    port: common.PORT,
  });
  req.setHeader('foo', 'bar');
  req.flushHeaders();
});
