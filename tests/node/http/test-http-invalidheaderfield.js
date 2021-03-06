'use strict';
var common = require('../common');
var assert = require('assert');
var EventEmitter = require('events');
var http = require('http');

var ee = new EventEmitter();
var count = 3;

var server = http.createServer(function(req, res) {
  assert.doesNotThrow(function() {
    res.setHeader('testing_123', 123);
  });
  assert.throws(function() {
    res.setHeader('testing 123', 123);
  }, TypeError);
  res.end('');
});
server.listen(common.PORT, function() {

  http.get({port: common.PORT}, function() {
    ee.emit('done');
  });

  assert.throws(
    function() {
      var options = {
        port: common.PORT,
        headers: {'testing 123': 123}
      };
      http.get(options, function() {});
    },
    function(err) {
      ee.emit('done');
      if (err instanceof TypeError) return true;
    }
  );

  assert.doesNotThrow(
    function() {
      var options = {
        port: common.PORT,
        headers: {'testing_123': 123}
      };
      http.get(options, function() {
        ee.emit('done');
      });
    }, TypeError
  );
});

ee.on('done', function() {
  if (--count === 0) {
    server.close();
  }
});
