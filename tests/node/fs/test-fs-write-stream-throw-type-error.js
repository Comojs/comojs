'use strict';
var common = require('../common');
var assert = require('assert');
var fs = require('fs');
var path = require('path');

var example = path.join(common.tmpDir, 'dummy');

common.refreshTmpDir();

assert.doesNotThrow(function() {
  fs.createWriteStream(example, undefined);
});
assert.doesNotThrow(function() {
  fs.createWriteStream(example, 'utf8');
});
assert.doesNotThrow(function() {
  fs.createWriteStream(example, {encoding: 'utf8'});
});

assert.throws(function() {
  fs.createWriteStream(example, null);
}, /"options" argument must be a string or an object/);
assert.throws(function() {
  fs.createWriteStream(example, 123);
}, /"options" argument must be a string or an object/);
assert.throws(function() {
  fs.createWriteStream(example, 0);
}, /"options" argument must be a string or an object/);
assert.throws(function() {
  fs.createWriteStream(example, true);
}, /"options" argument must be a string or an object/);
assert.throws(function() {
  fs.createWriteStream(example, false);
}, /"options" argument must be a string or an object/);
