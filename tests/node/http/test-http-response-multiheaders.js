'use strict';

var common = require('../common');
var http = require('http');
var assert = require('assert');

// Test that certain response header fields do not repeat.
// 'content-length' should also be in this list, but it needs
// a numeric value, so it's tested slightly differently.
var norepeat = [
  'content-type',
  'user-agent',
  'referer',
  'host',
  'authorization',
  'proxy-authorization',
  'if-modified-since',
  'if-unmodified-since',
  'from',
  'location',
  'max-forwards',
  'retry-after',
  'etag',
  'last-modified',
  'server',
  'age',
  'expires'
];

var server = http.createServer(function(req, res) {
  var num = req.headers['x-num'];
  if (num == 1) {
    res.setHeader('content-length', [1, 2]);
    norepeat.forEach(function(name){
      res.setHeader(name, ['A', 'B']);
    });
    res.setHeader('X-A', ['A', 'B']);
  } else if (num == 2) {
    var headers = {};
    headers['content-length'] = [1, 2];
    norepeat.forEach(function(name){
      headers[name] = ['A', 'B'];
    });
    headers['X-A'] = ['A', 'B'];
    res.writeHead(200, headers);
  }
  res.end('ok');
});

server.listen(common.PORT, common.mustCall(function() {
  for (var n = 1; n <= 2 ; n++) {
    // this runs twice, the first time, the server will use
    // setHeader, the second time it uses writeHead. The
    // result on the client side should be the same in
    // either case -- only the first instance of the header
    // value should be reported for the header fields listed
    // in the norepeat array.
    (function(n){
      http.get(
        {port:common.PORT, headers:{'x-num': n}},
        common.mustCall(function(res) {
          if (n == 2) server.close();
          assert.equal(res.headers['content-length'], 1);
          norepeat.forEach(function(name){
            assert.equal(res.headers[name], 'A');
          });
          assert.equal(res.headers['x-a'], 'A, B');
        })
      );
    })(n);
  }
}));
