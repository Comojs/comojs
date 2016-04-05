//fixme: win32 fails, large payload??!

'use strict';
var common = require('../common');
var assert = require('assert');
var http = require('http');
var payload = new Buffer(16390);
payload.fill('Й');
var len = 0;
var server = http.createServer(function(req, res) {
  res.writeHead(200);
  res.end();
  req.on('data', function(d){
    len += d.byteLength;
  });
  server.close();
});

server.listen(common.PORT, function() {

  var req = http.request({
    method: 'POST',
    port: common.PORT
  });


  req.write(payload);
  req.end();
});

process.on('exit', function(){
  assert.equal(len, payload.byteLength);
});
