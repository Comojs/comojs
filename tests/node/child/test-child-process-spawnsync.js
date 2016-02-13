'use strict';
var common = require('../common');
var assert = require('assert');

var spawnSync = require('child_process').spawnSync;
var spawn = require('child_process').spawn;

// Echo does different things on Windows and Unix, but in both cases, it does
// more-or-less nothing if there are no parameters
var ret = spawnSync('sleep', ['0']);
assert.strictEqual(ret.status, 0, 'exit status should be zero');

// Error test when command does not exist
var ret_err = spawnSync('command_does_not_exist', ['bar']).error;
console.log(ret_err);
assert.strictEqual(ret_err.code, 'ENOENT');
assert.strictEqual(ret_err.errno, 'ENOENT');
assert.strictEqual(ret_err.syscall, 'spawnSync command_does_not_exist');
assert.strictEqual(ret_err.path, 'command_does_not_exist');
assert.deepEqual(ret_err.spawnargs, ['bar']);

// Verify that the cwd option works - GH #7824
(function() {
  var response;
  var cwd;

  if (common.isWindows) {
    cwd = 'c:\\';
    response = spawnSync('cmd.exe', ['/c', 'cd'], {cwd: cwd});
  } else {
    cwd = '/';
    response = spawnSync('pwd', [], {cwd: cwd});
  }
  console.log(response.stdout.toString().trim());
  assert.strictEqual(response.stdout.toString().trim(), cwd);
})();

print('last');
