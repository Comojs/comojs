

var path = require('path');
var fs = require('fs');
var assert = require('assert');
// var os = require('os');
// var child_process = require('child_process');
var stream = require('stream');
var util = require('util');


exports.PORT = +process.env.NODE_COMMON_PORT || 12346;
exports.isWindows = process.platform === 'win32';
exports.testDir = path.dirname(__filename);
exports.fixturesDir = path.join(exports.testDir, 'fixtures');
exports.tmpDirName = 'tmp';

exports.tmpDir = path.join(exports.testDir, exports.tmpDirName);

function rimrafSync(p) {
  try {
    var st = fs.lstatSync(p);
  } catch (e) {
    if (e.code === 'ENOENT')
      return;
  }

  try {
    if (st && st.isDirectory())
      rmdirSync(p, null);
    else {
      fs.unlinkSync(p);
    }
  } catch (e) {
    if (e.code === 'ENOENT')
      return;
    if (e.code === 'EPERM')
      return rmdirSync(p, e);
    if (e.code !== 'EISDIR')
      throw e;
    rmdirSync(p, e);
  }
}

function rmdirSync(p, originalEr) {
  try {
    fs.rmdirSync(p);
  } catch (e) {
    if (e.code === 'ENOTDIR')
      throw originalEr;
    if (e.code === 'ENOTEMPTY' || e.code === 'EEXIST' || e.code === 'EPERM') {
      fs.readdirSync(p).forEach(function(f) {
        rimrafSync(path.join(p, f));
      });
      fs.rmdirSync(p);
    }
  }
}

exports.refreshTmpDir = function() {
  rimrafSync(exports.tmpDir);
  try {
    fs.mkdirSync(exports.tmpDir);
  } catch(e){}
};

exports.error = console.log;

exports.fileExists = function(pathname) {
  try {
    fs.accessSync(pathname);
    return true;
  } catch (err) {
    return false;
  }
};


var mustCallChecks = [];


function runCallChecks(exitCode) {
  if (exitCode !== 0) return;

  var failed = mustCallChecks.filter(function(context) {
    return context.actual !== context.expected;
  });

  failed.forEach(function(context) {
    console.log('Mismatched %s function calls. Expected %d, actual %d.',
                context.name,
                context.expected,
                context.actual);
    console.log(context.stack.split('\n').slice(2).join('\n'));
  });

  if (failed.length) process.exit(1);
}


exports.mustCall = function(fn, expected) {
  if (typeof expected !== 'number') expected = 1;

  var context = {
    expected: expected,
    actual: 0,
    stack: (new Error()).stack,
    name: fn.name || '<anonymous>'
  };

  // add the exit listener only once to avoid listener leak warnings
  if (mustCallChecks.length === 0) process.on('exit', runCallChecks);

  mustCallChecks.push(context);

  return function() {
    context.actual++;
    return fn.apply(this, arguments);
  };
};

exports.fail = function(msg) {
  assert.fail(null, null, msg);
};

exports.spawnPwd = function(options) {
  var spawn = require('child_process').spawn;

  if (exports.isWindows) {
    return spawn('cmd.exe', ['/c', 'cd'], options);
  } else {
    return spawn('pwd', [], options);
  }
};

exports.platformTimeout = function(ms) {
  if (process.arch !== 'arm')
    return ms;

  var armv = process.config.variables.arm_version;

  if (armv === '6')
    return 7 * ms;  // ARMv6

  if (armv === '7')
    return 2 * ms;  // ARMv7

  return ms; // ARMv8+
};

exports.weak = function(obj, cb){
  var called = false;
  Duktape.fin(obj, function (x) {
      if (called) return;
      called = true;
      try {
        cb();
      } catch (e) {
        print('WARNING: finalizer failed (ignoring): ' + e);
      }
  });
}

exports.hasMultiLocalhost = function hasMultiLocalhost() {
  var TCP = process.binding('tcp_wrap').TCP;
  var t = new TCP();
  var ret = t.bind('127.0.0.2', exports.PORT);
  t.close();
  return ret === 0;
};

if (exports.isWindows) {
  exports.PIPE = '\\\\.\\pipe\\libuv-test';
} else {
  exports.PIPE = exports.tmpDir + '/test.sock';
}

if (process.env.NODE_COMMON_PIPE) {
  exports.PIPE = process.env.NODE_COMMON_PIPE;
  // Remove manually, the test runner won't do it
  // for us like it does for files in test/tmp.
  try {
    fs.unlinkSync(exports.PIPE);
  } catch (e) {
    // Ignore.
  }
}

exports.indirectInstanceOf = function(obj, cls) {
  if (obj instanceof cls) { return true; }
  var clsChain = protoCtrChain(cls.prototype);
  var objChain = protoCtrChain(obj);
  return objChain.slice(-clsChain.length) === clsChain;
};

exports.mustNotCall = function(msg) {
  return function mustNotCall() {
    assert.fail(msg || 'function should not have been called');
  };
};
