'use strict';
var common = require('../common');
var assert = require('assert');
var fork = require('child_process').fork;

var expected = Array(1e4).join('ßßßß');
if (process.argv[2] === 'child') {
  process.send(expected);
} else {
  var child = fork(process.argv[1], ['child']);
  child.on('message', common.mustCall(function(actual) {
  	print('ok');
    assert.equal(actual, expected);
  }));
}
