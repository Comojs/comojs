
var process_wrap = process.binding('process_wrap').Process;
var loop = process.binding('loop');
var child_process = require('child_process');


// exports.spawn = function(options){
// 	// save main event loop as we
// 	// are going to use it again
// 	var main_loop = process.main_loop;

// 	// create new event loop
// 	var new_loop = process.main_loop = loop.init();

// 	// console.log(options);
// 	var Process = new process_wrap();
// 	Process.onexit = function tttest (){
// 		print('XXXXXXXXXXXXXXXX');
// 	};

// 	var h = loop.handle_init(new_loop, function(){
// 		print('XCC');
// 	});

// 	loop.timer_start(h, 100, 100);
// 	Process.spawn(options);
// 	loop.run(new_loop, 0);

// 	// reset back to main loop
// 	process.main_loop = main_loop;

// 	// free new loop
// 	loop.destroy(new_loop);

// 	// child_process.spawn
// 	// child_process.spawn(options.file, options.args, options);
// };

var iz = 9;
exports.spawn = function(a,b,c){
	// save main event loop as we
	// are going to use it again
	var main_loop = process.main_loop;
	var nextTick  = process.nextTick;

	process.nextTick = function(){
		var args = [].slice.call(arguments);
		var callback = args.shift();
		callback.apply(null, args);
	};

	// create new event loop
	var new_loop = process.main_loop = loop.init();

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
		process.main_loop = main_loop;
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

	loop.run(new_loop, 0);

	if (stdout.length > 0){
		result.output[1] = Buffer.concat(stdout);
	}

	if (stderr.length > 0){
		result.output[2] = Buffer.concat(stderr);
	}

	// reset back to main loop
	process.main_loop = main_loop;
	process.nextTick = nextTick;

	// free new loop
	// loop.destroy(new_loop);
	return result;
};
