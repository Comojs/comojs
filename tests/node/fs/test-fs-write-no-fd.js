'use strict';
var common = require('../common');
var fs = require('fs');
var assert = require('assert');

assert.throws(function() {
  fs.write(null, new Buffer(1), 0, 1);
}, /TypeError/);

assert.throws(function() {
  fs.write(null, '1', 0, 1);
}, /TypeError/);
