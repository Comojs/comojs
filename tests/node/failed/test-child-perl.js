var child_process = require('child_process');
var path = require('path');
var assert = require('assert');
var os = require('os');

var childPath = path.join(__dirname, '..', 'fixtures', 'child.pl');


var spawn = require('child_process').execFile;
var counter = 0;
var errorCount = 0;
var intervalCounter = 0;

var pl = spawn('perl', [childPath], {
	cwd : __dirname
});


var interval = setInterval(function(){
	intervalCounter++;
}, 100);


pl.stdout.on('data', function(data){
	counter++;
	pl.stdin.write("again\n");
	assert.strictEqual(data, "again" + os.EOL);
	// console.log('stdout: ', data);
});

pl.stderr.on('data', function(data){
	errorCount++;
	assert.strictEqual(data.toString(), "error");
});

pl.on('close', function(code){
	assert.strictEqual(code, 0);
	console.log('child process exited with code :', code);
	clearInterval(interval);
});

pl.on('error', function(code){
	console.log('child Error :', code);
});

// start by writing to child's stdin
pl.stdin.write("again\n");

process.on('exit', function(){
	assert.equal(errorCount, 2);
	assert.equal(counter, 1002);
	assert(intervalCounter > 5);
});
