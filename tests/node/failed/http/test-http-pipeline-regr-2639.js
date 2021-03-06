'use strict';
var common = require('../common');
var assert = require('assert');
var http = require('http');
var net = require('net');

var COUNT = 10;

var received = 0;

var server = http.createServer(function(req, res) {
  // Close the server, we have only one TCP connection anyway
  if (received++ === 0)
    server.close();

  res.writeHead(200);
  res.write('data');

  setTimeout(function() {
    res.end();
  }, (Math.random() * 100) | 0);
}).listen(common.PORT, function() {
  var s = net.connect(common.PORT);

  var big = '';
  for (var i = 0; i < COUNT; i++)
    big += 'GET / HTTP/1.0\r\n\r\n';
  s.write(big);
  s.resume();
});

process.on('exit', function() {
  assert.equal(received, COUNT);
});
