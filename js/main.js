this.global = this;

global.DTRACE_NET_SERVER_CONNECTION = function(){};
global.LTTNG_NET_SERVER_CONNECTION  = function(){};
global.COUNTER_NET_SERVER_CONNECTION = function(){};
global.COUNTER_NET_SERVER_CONNECTION_CLOSE = function(){};
global.DTRACE_NET_STREAM_END = function(){};
global.LTTNG_NET_STREAM_END = function(){};
global.NODE_BUFFER = Buffer;

//FIXME: use Objectsetporperity instead?!
//definegetter polufill
if (typeof Object.prototype.__defineGetter__ === 'undefined') {
	Object.defineProperty(Object.prototype, '__defineGetter__', {
		value: function (n, f) {
			Object.defineProperty(this, n, { enumerable: true, configurable: true, get: f });
		}, writable: true, enumerable: false, configurable: true
	});
}

// Number.isFinite polyfill
// http://people.mozilla.org/~jorendorff/es6-draft.html#sec-number.isfinite
if (typeof Number.isFinite !== 'function') {
	Number.isFinite = function isFinite(value) {
		// 1. If Type(number) is not Number, return false.
		if (typeof value !== 'number') {
			return false;
		}
		// 2. If number is NaN, +∞, or −∞, return false.
		if (value !== value || value === Infinity || value === -Infinity) {
			return false;
		}
		// 3. Otherwise, return true.
		return true;
	};
}

(function(process){
	'use strict';

	process.execArgv = [];

	process.throwErrno = function(errno){
		errno = errno || process.errno;
		throw new Error("Errno Error " + errno + "\n" + "Errno: " + process.errno);
	};

	process.reportError = function (e){
		print(e.stack || e);
		process.reallyExit(1);
	};

	process.moduleLoadList = [];
	var binding_modules = process.bindings;
	delete process.bindings; //clean up

	var cached_bindings = {};
	var wrap_test       = /_wrap/i;
	process.binding = function (name){
		if (name === 'uv') name = 'uv_wrap';
		if ( wrap_test.test(name) ){
			return NativeModule.require(name);
		} else if (name === 'http_parser'){
			return NativeModule.require('http_parser');
		}

		var binding_func = binding_modules[name];
		if (!binding_func) {
			throw new Error('unknown binding name ' + name);
		}

		if (!cached_bindings[name]) {
			cached_bindings[name] = binding_func();
		}
		return cached_bindings[name];
	};

	process.MakeCallback = function (handle, string, a, b, c, d, e) {
		// process._tickCallBack();
		if (!handle[string]) return;
		process.nextTick(function(){
			handle[string](a, b, c, d, e);
		});
	};

	function startup () {

		//in case of using tcc by running como.bat the first argument will
		//be main.c so we need to replace this
		if (process.argv[0] == 'src/main.c') {
			process.argv[0] = process.platform === 'win32' ? 'como.bat' : './como.sh';
		} else {
			process.argv[0] = process.platform === 'win32' ? './como.exe' : './como';
		}

		var EventEmitter = NativeModule.require('events').EventEmitter;
		process.__proto__ = Object.create(EventEmitter.prototype, {
			constructor: {
				value: process.constructor
			}
		});

		EventEmitter.call(process);

		var path = NativeModule.require('path');
		process.execPath = path.resolve(process.cwd() + '/' + process.argv[0]);
		// process.argv[0] = process.execPath;
		global.Buffer = NativeModule.require('buffer').Buffer;

		startup.processAssert();
		startup.globalTimeouts();
		startup.syscallAndUV();

		startup.processKillAndExit();

		startup.nextTick();

		// startup.processStdio();
		startup.globalConsole();

		startup.processChannel();
		//initiate go globals
		//NativeModule.require('go/globals');
	}

	// initiate uv and syscall with some related functions
	// associated by default with process object
	//===========================================================
	  var syscall, UV;
	  startup.syscallAndUV = function() {
	//===========================================================
		syscall = NativeModule.require('syscall');
		UV      = NativeModule.require('uv');
		process._kill = UV.kill;

		process.setuid = syscall.setuid;
		process.getuid = syscall.getuid;
	};

	var assert;
	startup.processAssert = function() {
		assert = process.assert = function(x, msg) {
			if (!x) throw new Error(msg || 'assertion error');
		};
	};

	startup._lazyConstants = null;

	startup.lazyConstants = function() {
		if (!startup._lazyConstants) {
			startup._lazyConstants = process.binding('constants');
		}
		return startup._lazyConstants;
	};

	startup.processKillAndExit = function() {

		process.exit = function(code) {
			code = Number(code) || 0;
			process.exitCode = code;
			if (!process._exiting) {
				process._exiting = true;
				process.emit('exit', process.exitCode);
			}

			process.reallyExit(process.exitCode);
		};

		process.kill = function(pid, sig) {
			var err;
			if (pid != (pid | 0)) {
				throw new TypeError('invalid pid');
			}

			// preserve null signal
			if (0 === sig) {
				err = process._kill(pid, 0);
			} else {
				sig = sig || 'SIGTERM';
				if (startup.lazyConstants()[sig] &&
						sig.slice(0, 3) === 'SIG') {
					err = process._kill(pid, startup.lazyConstants()[sig]);
				} else {
					throw new Error('Unknown signal: ' + sig);
				}
			}

			if (err) {
				var errnoException = NativeModule.require('util')._errnoException;
				throw errnoException(err, 'kill');
			}

			return true;
		};
	};

	startup.processChannel = function() {
		// If we were spawned with env NODE_CHANNEL_FD then load that up and
		// start parsing data from that stream.
		if (process.env.NODE_CHANNEL_FD) {
			var fd = parseInt(process.env.NODE_CHANNEL_FD, 10);
			assert(fd >= 0);
			// Make sure it's not accidentally inherited by child processes.
			delete process.env.NODE_CHANNEL_FD;

			var cp = NativeModule.require('child_process');
			var syscall = NativeModule.require('syscall');

			// Load tcp_wrap to avoid situation where we might immediately receive
			// a message.
			// FIXME is this really necessary?
			process.binding('tcp_wrap');
			try {
				var como_fd = 'COMO_FD_' + fd;
				fd = process.env[como_fd] || fd;
				var handle = parseInt(fd, 10);
				cp._forkChild(handle);
			} catch(e){
				console.log(e.stack);
				process.exit(2);
			}

			assert(process.send);
		}
	};

	startup.nextTick = function(){
		var nextTickQueue = [];

		var kLength   = 0;
		var kIndex    = 0;
		var tock, callback, args;

		var tickDone = function(){
			if (kLength !== 0) {
				if (kLength <= kIndex) {
					nextTickQueue = [];
					nextTickQueue.length = 0;
					kLength = 0;
				} else {
					nextTickQueue.splice(0, kIndex);
					kLength = nextTickQueue.length;
				}
			}
			kIndex = 0;
		};

		var slice = Array.prototype.slice;
		process.nextTick = function (){
			var args = slice.call(arguments);
			var callback = args.shift();

			// on the way out, don't bother. it won't get fired anyway.
			if (process._exiting) return;

			// if (kLength > 500){
			//     process._tickCallBack();
			// }

			kLength++;
			nextTickQueue.push({
				callback : callback,
				args     : args
			});
		};

		process._tickCallBack = function(){
			while (kIndex < kLength){
				var tock = nextTickQueue[kIndex++];
				var callback = tock.callback;
				var args = tock.args;
				var threw = true;
				try {
					switch(args.length){
						case 0  : callback(); break;
						case 1  : callback(args[0]); break;
						case 2  : callback(args[0], args[1]); break;
						case 3  : callback(args[0], args[1], args[2]); break;
						case 4  : callback(args[0], args[1], args[2], args[3]); break;
						default : callback.apply(null, args);
					}
					threw = false;
				} finally {
					if (threw) tickDone();
				}
			}
			tickDone();
		};
	};

	startup.globalTimeouts = function() {
		var loop = process.binding('loop');
		var _default = loop.init();
		process.main_loop = _default;

		global.setTimeout = function(fn, timeout, a, b, c) {
			var h = loop.handle_init(_default, fn);

			fn.timerHandle = h;
			loop.timer_start(h, timeout, 0);
			return fn;
		};

		global.setInterval = function(fn, timeout) {
			var h = loop.handle_init(process.main_loop, fn);
			fn.timerHandle = h;
			fn.unref = function(){
				loop.handle_unref(h);
			};
			loop.timer_start(h, timeout, timeout);
			return fn;
		};

		global.clearTimeout = global.clearInterval = function(timer) {
			if (!timer.timerHandle){
				throw new Error("clearing Timer Error");
			}
			loop.handle_close(timer.timerHandle);
			timer.timerHandle = null;
		};

		global.setImmediate = function() {
			var t = NativeModule.require('timers');
			return t.setImmediate.apply(this, arguments);
		};

		global.clearImmediate = function() {
			var t = NativeModule.require('timers');
			return t.clearImmediate.apply(this, arguments);
		};
	};

	startup.globalConsole = function() {
		global.console = NativeModule.require('console');
	};

	startup.processStdio  = function() {

		var stdio = NativeModule.require('./setup/stdio.js');
		var stdin, stdout, stderr;

		//stdout
		process.__defineGetter__('stdout', function() {
			if (stdout) return stdout;
			stdout = stdio.createWritableStdioStream(1);
			stdout.destroy = stdout.destroySoon = function(er) {
				er = er || new Error('process.stdout cannot be closed.');
				stdout.emit('error', er);
			};

			if (stdout.isTTY) {
				process.on('SIGWINCH', function() {
					stdout._refreshSize();
				});
			}
			return stdout;
		});

		//stderr
		process.__defineGetter__('stderr', function() {
			if (stderr) return stderr;
			stderr = stdio.createWritableStdioStream(2);
			stderr.destroy = stderr.destroySoon = function(er) {
				er = er || new Error('process.stderr cannot be closed.');
				stderr.emit('error', er);
			};

			if (stderr.isTTY) {
				process.on('SIGWINCH', function() {
					stderr._refreshSize();
				});
			}
			return stderr;
		});

		//stdin
		process.__defineGetter__('stdin', function() {
			if (stdin) return stdin;
			stdin = stdio.createReadableStdioStream(0);
			return stdin;
		});
	};

	var NativeModule = process.NativeModule = function(id) {
		this.filename = NativeModule._source[id];// + '.js';
		this.id = id;
		this.exports = {};
		this.loaded = false;
	}


	var NativeModulesMap;
	try {
		NativeModulesMap = process.readFile('./src/ModulesMap.json');
		NativeModulesMap = JSON.parse(NativeModulesMap);
	} catch(e){
		NativeModulesMap = process.NativeSource.fileMap;
	}

	NativeModule._source = NativeModulesMap;
	NativeModule._cache  = {};

	NativeModule.require = function(id, p) {
		if (id == 'native_module') {
			return NativeModule;
		}

		var cached = NativeModule.getCached(id);
		if (cached) {
			return cached.exports;
		}

		if (!NativeModule.exists(id)) {
			var t = NativeModule.require('module');
			var path = NativeModule.require('path');

			return t.require(path.resolve(process.cwd() + '/js/' + id));
			throw new Error('No such native module ' + id);
		}

		process.moduleLoadList.push('NativeModule ' + id);
		var nativeModule = new NativeModule(id);
		nativeModule.cache();
		nativeModule.compile();
		return nativeModule.exports;
	};

	NativeModule.getCached = function(id) {
		return NativeModule._cache[id];
	};

	NativeModule.exists = function(id) {
		return NativeModule._source.hasOwnProperty(id);
	};

	NativeModule.getSource = function(id) {
		var filename = NativeModule._source[id];
		if (process.NativeSource){
			var source = process.NativeSource[id];
			//this will be cached so clean up
			delete process.NativeSource[id];
			return source;
		}
		return process.readFile(filename);
	};

	NativeModule.wrap = function(script) {
		return NativeModule.wrapper[0] + script + NativeModule.wrapper[1];
	};

	NativeModule.wrapper = [
		'(function (exports, require, module, __filename, __dirname) {' +
			'var fn = (function(){',
			//source here
			'\n});' +
			'try {' +
				'fn();\n' +
			'} catch (e){\n' +
				'process.reportError(e);\n' +
			'};\n'+
		'});'
	];

	NativeModule.prototype.compile = function() {
		var source = NativeModule.getSource(this.id);
		source = NativeModule.wrap(source);
		var fn = process.eval(source, NativeModule._source[this.id]);
		try {
			fn(this.exports, NativeModule.require, this, this.filename);
		} catch(e){
			process.reallyExit(1);
		}
		this.loaded = true;
	};

	NativeModule.prototype.cache = function() {
		NativeModule._cache[this.id] = this;
	};

	startup();

	var _run_looop = function(){
		var main_loop = process.main_loop;
		var loop = process.binding('loop');
		var gcHandle = loop.handle_init(main_loop, function(){
			Duktape.gc();
		});
		loop.handle_unref(gcHandle);
		loop.timer_start(gcHandle, 5000, 5000);

		try {
			var i = 0;
			var n = 0;
			while(1){

				for (i = 0; i < 16; i++){
					process._tickCallBack();
					n = loop.run(main_loop, 1);
					if (n == 0) break;
				}

				process._tickCallBack();
				n = loop.run(main_loop, 1);
				if (n == 0) break;
				process.sleep(1);
			}

			// loop.run(main_loop, 0);
			process.emit('exit', 0);
		} catch (e){
			process.reportError(e);
		}
	};

	var r = NativeModule.require('module');
	var argv = process.argv;
	if (argv[1]) {
		process.main = true;
		r.require(process.argv[1]);
	}

	_run_looop();
})(process);
