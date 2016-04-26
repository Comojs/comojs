var process_wrap = process.binding('process_wrap').Process;
var binding = process.binding('loop');
var loop = require('loop').main;
var child_process = require('child_process');


exports.spawn = function(a,b,c){
	// save main event loop as we
	// are going to use it again
	var main_loop = loop._handle;
	var nextTick  = process.nextTick;

	process.nextTick = function(){
		var args = [].slice.call(arguments);
		var callback = args.shift();
		callback.apply(null, args);
	};

	// create new event loop handle
	// change main loop handle to this new
	// loop handle, run then, reset back the original
	// loop handle
	loop._handle = binding.init();

	var result = {
		status : 0,
		output : []
	};

	var stdout = [];
	var stderr = [];
	var status;

	try {
		var child = child_process.spawn.apply(null, arguments);
	} catch (e){
		e.syscall = e.syscall.replace('spawn', 'spawnSync');
		result.error = e;
		loop._handle = main_loop;
		process.nextTick = nextTick;
		return result;
	}

	child.on('exit', function(code){
		result.status = code;
	});

	// child.on('error', function(e){
	// 	result.error = e;
	// });

	child.stdout.on('data', function(data){
		stdout.push(data);
	});

	child.stderr.on('data', function(data){
		stderr.push(data);
	});

	loop.run(0);

	if (stdout.length > 0){
		result.output[1] = Buffer.concat(stdout);
	}

	if (stderr.length > 0){
		result.output[2] = Buffer.concat(stderr);
	}

	// reset back to main loop
	loop._handle = main_loop;
	process.nextTick = nextTick;

	return result;
};
