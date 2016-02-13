'use strict';
var common = require('../common');
var assert = require('assert');
var path = require('path');
var net = require('net');
var fork = require('child_process').fork;
var spawn = require('child_process').spawn;

var emptyFile = path.join(common.fixturesDir, 'empty.js');

var n = fork(emptyFile);

var rv = n.send({ hello: 'world' });
assert.strictEqual(rv, true);

var spawnOptions = { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] };
var s = spawn(process.execPath, [emptyFile], spawnOptions);
var handle = null;
s.on('exit', function() {
  handle.close();
});

net.createServer(common.fail).listen(common.PORT, function() {
  handle = this._handle;
  assert.strictEqual(s.send('one', handle), true);
  assert.strictEqual(s.send('two', handle), true);
  assert.strictEqual(s.send('three'), false);
  assert.strictEqual(s.send('four'), false);
});
