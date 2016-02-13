'use strict';
require('../common');

var assert = require('assert');

var spawnSync = require('child_process').spawnSync;

var msgOut = 'this is stdout';
var msgErr = 'this is stderr';

// this is actually not os.EOL?
var msgOutBuf = new Buffer(msgOut + '\n');
var msgErrBuf = new Buffer(msgErr + '\n');

var args = [
  '-e',
  'console.log("' + msgOut +'"); console.error("' + msgErr + '");'
];

var ret;


function checkSpawnSyncRet(ret) {
  assert.strictEqual(ret.status, 0);
  assert.strictEqual(ret.error, undefined);
};

function verifyBufOutput(ret) {
  checkSpawnSyncRet(ret);
  assert.deepEqual(ret.stdout, msgOutBuf);
  assert.deepEqual(ret.stderr, msgErrBuf);
}

if (process.argv.indexOf('spawnchild') !== -1) {
  switch (process.argv[3]) {
    case '1':
      ret = spawnSync(process.execPath, args, { stdio: 'inherit' });
      checkSpawnSyncRet(ret);
      break;
    case '2':
      ret = spawnSync(process.execPath, args, {
        stdio: ['inherit', 'inherit', 'inherit']
      });
      checkSpawnSyncRet(ret);
      break;
  }
  process.exit(0);
  return;
}

verifyBufOutput(spawnSync(process.execPath, [__filename, 'spawnchild', 1]));
verifyBufOutput(spawnSync(process.execPath, [__filename, 'spawnchild', 2]));

var options = {
  input: 1234
};

assert.throws(function() {
  spawnSync('cat', [], options);
}, /TypeError:.*should be Buffer or string not number/);


options = {
  input: 'hello world'
};

ret = spawnSync('cat', [], options);

checkSpawnSyncRet(ret);
assert.strictEqual(ret.stdout.toString('utf8'), options.input);
assert.strictEqual(ret.stderr.toString('utf8'), '');

options = {
  input: new Buffer('hello world')
};

ret = spawnSync('cat', [], options);

checkSpawnSyncRet(ret);
assert.deepEqual(ret.stdout, options.input);
assert.deepEqual(ret.stderr, new Buffer(''));

verifyBufOutput(spawnSync(process.execPath, args));

ret = spawnSync(process.execPath, args, { encoding: 'utf8' });

checkSpawnSyncRet(ret);
assert.strictEqual(ret.stdout, msgOut + '\n');
assert.strictEqual(ret.stderr, msgErr + '\n');
