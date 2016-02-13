'use strict';
var common = require('../common');
var assert = require('assert');
var ch = require('child_process');

var SIZE = 100000;
var childGone = false;

var cp = ch.spawn('perl', ['-e', 'print STDERR "C" x ' + SIZE], {
  stdio: [ 'inherit', 'inherit', 'inherit' ],
  cwd : __dirname
});

cp.on('exit', function(code) {
  childGone = true;
  assert.equal(0, code);
});

process.on('exit', function() {
  assert.ok(childGone);
});
