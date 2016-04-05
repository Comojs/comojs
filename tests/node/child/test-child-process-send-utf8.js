//FIXME raise string length fails on both windows & linux?!!
'use strict';
var common = require('../common');
var assert = require('assert');
var fork = require('child_process').fork;

var expected = Array(1e3).join('ßßßß');
if (process.argv[2] === 'child') {
  process.send(expected);
} else {
  var child = fork(process.argv[1], ['child']);
  child.on('message', common.mustCall(function(actual) {
  	console.log(actual.length);
    console.log(expected.length);
    assert.equal(actual, expected);
  }));
}
