'use strict';
var cp = require('child_process');
var common = require('../common');
var assert = require('assert');

var p = cp.spawn('echo');

p.on('close', common.mustCall(function(code, signal) {
  assert.strictEqual(code, 0);
  assert.strictEqual(signal, null);
}));

p.stdout.read();

setTimeout(function() {
  p.kill();
}, 500);
