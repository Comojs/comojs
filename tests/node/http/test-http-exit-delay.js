'use strict';
var assert = require('assert');
var common = require('../common');
var http = require('http');

var start;
var server = http.createServer(common.mustCall(function(req, res) {
  req.resume();
  req.on('end', function() {
    res.end('Success');
  });

  server.close();
}));

server.listen(common.PORT, 'localhost', common.mustCall(function() {
  start = new Date();
  var req = http.request({
    'host': 'localhost',
    'port': common.PORT,
    'agent': false,
    'method': 'PUT'
  });
  req.end('Test');
}));

process.on('exit', function() {
  var end = new Date();
  assert(end - start < 1000, 'Entire test should take less than one second');
});
