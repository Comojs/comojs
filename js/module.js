'use strict';

const NativeModule = process.NativeModule;
const util = require('util');
const internalModule = {};

internalModule.stripBOM = function(content) {
	if (content.charCodeAt(0) === 0xFEFF) {
		content = content.slice(1);
	}
	return content;
};

internalModule.makeRequireFunction = function() {
	const Module = this.constructor;
	const self = this;

	function require(path) {
		return self.require(path);
	}

	require.resolve = function(request) {
		return Module._resolveFilename(request, self);
	};

	require.main = process.mainModule;

	// Enable support to add extra extension types.
	require.extensions = Module._extensions;

	require.cache = Module._cache;

	return require;
};

const runInThisContext = function(script, options){
	return process.eval(script, options.filename, options.lineOffset);
};

const internalUtil = require('internal/util');
const assert = require('assert').ok;
const fs = require('fs');
const path = require('path');
path._makeLong = function(p){ return p };

const internalModuleReadFile = function(file){
	if (process.isFile(file)){
		var content = process.readFile(file);
		return internalModule.stripBOM(content);
	}
	return;
};

const internalModuleStat = function(file){
	return process.stat(file);
};

const splitRe = process.platform === 'win32' ? /[\/\\]/ : /\//;
const isIndexRe = /^index\.\w+?$/;
const shebangRe = /^\#\!.*/;

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
	return Object.prototype.hasOwnProperty.call(obj, prop);
}


function Module(id, parent) {
	this.id = id;
	this.exports = {};
	this.parent = parent;
	if (parent && parent.children) {
		parent.children.push(this);
	}

	this.filename = null;
	this.loaded = false;
	this.children = [];
}
module.exports = Module;

Module._cache = {};
Module._pathCache = {};
Module._extensions = {};
var modulePaths = [];
Module.globalPaths = [];

Module.wrapper = NativeModule.wrapper;
Module.wrap = NativeModule.wrap;
Module._debug = util.debuglog('module');

// We use this alias for the preprocessor that filters it out
const debug = Module._debug;


// given a module name, and a list of paths to test, returns the first
// matching file in the following precedence.
//
// require("a.<ext>")
//   -> a.<ext>
//
// require("a")
//   -> a
//   -> a.<ext>
//   -> a/index.<ext>

// check if the directory is a package.json dir
const packageMainCache = {};

function readPackage(requestPath) {
	if (hasOwnProperty(packageMainCache, requestPath)) {
		return packageMainCache[requestPath];
	}

	var jsonPath = path.resolve(requestPath, 'package.json');
	var json = internalModuleReadFile(path._makeLong(jsonPath));

	if (json === undefined) {
		return false;
	}

	try {
		var pkg = packageMainCache[requestPath] = JSON.parse(json).main;
	} catch (e) {
		e.path = jsonPath;
		e.message = 'Error parsing ' + jsonPath + ': ' + e.message;
		throw e;
	}
	return pkg;
}

function tryPackage(requestPath, exts) {
	var pkg = readPackage(requestPath);

	if (!pkg) return false;

	var filename = path.resolve(requestPath, pkg);
	return tryFile(filename) || tryExtensions(filename, exts) ||
				 tryExtensions(path.resolve(filename, 'index'), exts);
}

// In order to minimize unnecessary lstat() calls,
// this cache is a list of known-real paths.
// Set to an empty object to reset.
Module._realpathCache = {};

// check if the file exists and is not a directory
function tryFile(requestPath) {
	const rc = internalModuleStat(path._makeLong(requestPath));
	return rc === 0 && toRealPath(requestPath);
}

function toRealPath(requestPath) {
	return fs.realpathSync(requestPath, Module._realpathCache);
}

// given a path check a the file exists with any of the set extensions
function tryExtensions(p, exts) {
	for (var i = 0, EL = exts.length; i < EL; i++) {
		var filename = tryFile(p + exts[i]);

		if (filename) {
			return filename;
		}
	}
	return false;
}

var warned = false;
Module._findPath = function(request, paths) {
	var exts = Object.keys(Module._extensions);

	if (path.isAbsolute(request)) {
		paths = [''];
	}

	var trailingSlash = (request.slice(-1) === '/');

	var cacheKey = JSON.stringify({request: request, paths: paths});
	if (Module._pathCache[cacheKey]) {
		return Module._pathCache[cacheKey];
	}

	// For each path
	for (var i = 0, PL = paths.length; i < PL; i++) {
		// Don't search further if path doesn't exist
		if (paths[i] && internalModuleStat(path._makeLong(paths[i])) < 1) continue;
		var basePath = path.resolve(paths[i], request);
		var filename;

		if (!trailingSlash) {
			const rc = internalModuleStat(path._makeLong(basePath));
			if (rc === 0) {  // File.
				filename = toRealPath(basePath);
			} else if (rc === 1) {  // Directory.
				filename = tryPackage(basePath, exts);
			}

			if (!filename) {
				// try it with each of the extensions
				filename = tryExtensions(basePath, exts);
			}
		}

		if (!filename) {
			filename = tryPackage(basePath, exts);
		}

		if (!filename) {
			// try it with each of the extensions at "index"
			filename = tryExtensions(path.resolve(basePath, 'index'), exts);
		}

		if (filename) {
			// Warn once if '.' resolved outside the module dir
			if (request === '.' && i > 0) {
				warned = internalUtil.printDeprecationMessage(
					'warning: require(\'.\') resolved outside the package ' +
					'directory. This functionality is deprecated and will be removed ' +
					'soon.', warned);
			}

			Module._pathCache[cacheKey] = filename;
			return filename;
		}
	}
	return false;
};

// 'from' is the __dirname of the module.
Module._nodeModulePaths = function(from) {
	// guarantee that 'from' is absolute.
	from = path.resolve(from);

	// note: this approach *only* works when the path is guaranteed
	// to be absolute.  Doing a fully-edge-case-correct path.split
	// that works on both Windows and Posix is non-trivial.
	var paths = [];
	var parts = from.split(splitRe);

	for (var tip = parts.length - 1; tip >= 0; tip--) {
		// don't search in .../node_modules/node_modules
		if (parts[tip] === 'node_modules') continue;
		var dir = parts.slice(0, tip + 1).concat('node_modules').join(path.sep);
		paths.push(dir);
	}

	return paths;
};


Module._resolveLookupPaths = function(request, parent) {
	if (NativeModule.nonInternalExists(request)) {
		return [request, []];
	}

	var start = request.substring(0, 2);
	if (start !== './' && start !== '..') {
		var paths = modulePaths;
		if (parent) {
			if (!parent.paths) parent.paths = [];
			paths = parent.paths.concat(paths);
		}

		// Maintain backwards compat with certain broken uses of require('.')
		// by putting the module's directory in front of the lookup paths.
		if (request === '.') {
			if (parent && parent.filename) {
				paths.splice(0, 0, path.dirname(parent.filename));
			} else {
				paths.splice(0, 0, path.resolve(request));
			}
		}

		return [request, paths];
	}

	// with --eval, parent.id is not set and parent.filename is null
	if (!parent || !parent.id || !parent.filename) {
		// make require('./path/to/foo') work - normally the path is taken
		// from realpath(__filename) but with eval there is no filename
		var mainPaths = ['.'].concat(modulePaths);
		mainPaths = Module._nodeModulePaths('.').concat(mainPaths);
		return [request, mainPaths];
	}

	// Is the parent an index module?
	// We can assume the parent has a valid extension,
	// as it already has been accepted as a module.
	var isIndex = isIndexRe.test(path.basename(parent.filename));
	var parentIdPath = isIndex ? parent.id : path.dirname(parent.id);
	var id = path.resolve(parentIdPath, request);

	// make sure require('./path') and require('path') get distinct ids, even
	// when called from the toplevel js file
	if (parentIdPath === '.' && id.indexOf('/') === -1) {
		id = './' + id;
	}

	debug('RELATIVE: requested: %s set ID to: %s from %s', request, id,
				parent.id);

	return [id, [path.dirname(parent.filename)]];
};


// Check the cache for the requested file.
// 1. If a module already exists in the cache: return its exports object.
// 2. If the module is native: call `NativeModule.require()` with the
//    filename and return the result.
// 3. Otherwise, create a new module for the file and save it to the cache.
//    Then have it load  the file contents before returning its exports
//    object.
Module._load = function(request, parent, isMain) {
	if (parent) {
		debug('Module._load REQUEST %s parent: %s', request, parent.id);
	}

	var filename = Module._resolveFilename(request, parent);

	var cachedModule = Module._cache[filename];
	if (cachedModule) {
		return cachedModule.exports;
	}

	if (NativeModule.nonInternalExists(filename)) {
		debug('load native module %s', request);
		return NativeModule.require(filename);
	}

	var module = new Module(filename, parent);

	if (isMain) {
		process.mainModule = module;
		module.id = '.';
	}

	Module._cache[filename] = module;

	var hadException = true;

	try {
		module.load(filename);
		hadException = false;
	} finally {
		if (hadException) {
			delete Module._cache[filename];
		}
	}

	return module.exports;
};

Module._resolveFilename = function(request, parent) {
	if (NativeModule.nonInternalExists(request)) {
		return request;
	}

	var resolvedModule = Module._resolveLookupPaths(request, parent);
	var id = resolvedModule[0];
	var paths = resolvedModule[1];

	// look up the filename first, since that's the cache key.
	debug('looking for %j in %j', id, paths);

	var filename = Module._findPath(request, paths);
	if (!filename) {
		var err = new Error("Cannot find module '" + request + "'");
		err.code = 'MODULE_NOT_FOUND';
		throw err;
	}
	return filename;
};


// Given a file name, pass it to the proper extension handler.
Module.prototype.load = function(filename) {
	debug('load %j for module %j', filename, this.id);

	assert(!this.loaded);
	this.filename = filename;
	this.paths = Module._nodeModulePaths(path.dirname(filename));

	var extension = path.extname(filename) || '.js';
	if (!Module._extensions[extension]) extension = '.js';
	Module._extensions[extension](this, filename);
	this.loaded = true;
};


// Loads a module at the given file path. Returns that module's
// `exports` property.
Module.prototype.require = function(path) {
	assert(path, 'missing path');
	assert(typeof path === 'string', 'path must be a string');
	return Module._load(path, this);
};


// Resolved path to process.argv[1] will be lazily placed here
// (needed for setting breakpoint when called with --debug-brk)
var resolvedArgv;


// Run the file contents in the correct scope or sandbox. Expose
// the correct helper variables (require, module, exports) to
// the file.
// Returns exception, if any.
Module.prototype._compile = function(content, filename) {
	// remove shebang
	content = content.replace(shebangRe, '');

	// create wrapper function
	var wrapper = Module.wrap(content);

	var compiledWrapper = runInThisContext(wrapper,
		{ filename: filename, lineOffset: 0 });
	if (global.v8debug) {
		if (!resolvedArgv) {
			// we enter the repl if we're not given a filename argument.
			if (process.argv[1]) {
				resolvedArgv = Module._resolveFilename(process.argv[1], null);
			} else {
				resolvedArgv = 'repl';
			}
		}

		// Set breakpoint on module start
		if (filename === resolvedArgv) {
			// Installing this dummy debug event listener tells V8 to start
			// the debugger.  Without it, the setBreakPoint() fails with an
			// 'illegal access' error.
			global.v8debug.Debug.setListener(function() {});
			global.v8debug.Debug.setBreakPoint(compiledWrapper, 0, 0);
		}
	}
	const dirname = path.dirname(filename);
	const require = internalModule.makeRequireFunction.call(this);
	const args = [this.exports, require, this, filename, dirname];
	return compiledWrapper.apply(this.exports, args);
};


// Native extension for .js
Module._extensions['.js'] = function(module, filename) {
	var content = fs.readFileSync(filename, 'utf8');
	module._compile(internalModule.stripBOM(content), filename);
};


// Native extension for .json
Module._extensions['.json'] = function(module, filename) {
	var content = fs.readFileSync(filename, 'utf8');
	try {
		module.exports = JSON.parse(internalModule.stripBOM(content));
	} catch (err) {
		err.message = filename + ': ' + err.message;
		throw err;
	}
};


//Native extension for .node
Module._extensions['.como'] =
Module._extensions['.node'] = function(module, filename) {
	return process.dlopen(module, path._makeLong(filename));
};


// bootstrap main module.
Module.runMain = function() {
	// Load the main module--the command line argument.
	Module._load(process.argv[1], null, true);
	// Handle any nextTicks added in the first tick of the program
	process._tickCallback();
};

Module._initPaths = function() {
	const isWindows = process.platform === 'win32';

	if (isWindows) {
		var homeDir = process.env.USERPROFILE;
	} else {
		var homeDir = process.env.HOME;
	}

	var paths = [path.resolve(process.execPath, '..', '..', 'lib', 'node')];

	if (homeDir) {
		paths.unshift(path.resolve(homeDir, '.node_libraries'));
		paths.unshift(path.resolve(homeDir, '.node_modules'));
	}

	var nodePath = process.env['NODE_PATH'];
	if (nodePath) {
		paths = nodePath.split(path.delimiter).filter(function(path) {
			return !!path;
		}).concat(paths);
	}

	modulePaths = paths;

	// clone as a read-only copy, for introspection.
	Module.globalPaths = modulePaths.slice(0);
};

// TODO(bnoordhuis) Unused, remove in the future.
Module.requireRepl = internalUtil.deprecate(function() {
	return NativeModule.require('internal/repl');
}, 'Module.requireRepl is deprecated.');

Module._preloadModules = function(requests) {
	if (!Array.isArray(requests))
		return;

	// Preloaded modules have a dummy parent module which is deemed to exist
	// in the current working directory. This seeds the search path for
	// preloaded modules.
	var parent = new Module('internal/preload', null);
	try {
		parent.paths = Module._nodeModulePaths(process.cwd());
	}
	catch (e) {
		if (e.code !== 'ENOENT') {
			throw e;
		}
	}
	requests.forEach(function(request) {
		parent.require(request);
	});
};

Module._initPaths();

// backwards compatibility
Module.Module = Module;
