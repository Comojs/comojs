var child_process = require('child_process');

var socket = require('socket');
var uv = require('uv');
var s = socket.socket(socket.AF_INET, socket.SOCK_STREAM, 6);
uv.make_inheritable(s);
console.log(s);

child_process.exec('perl p.pl', function (err, stdout, stderr){
    if (err) {
        console.log("child processes failed with error code: " +
            err.code);
    }
    console.log(stdout);
});


var cc = child_process.exec('perl p.pl', {env : {"USERPROFILE": 99999}}, function (err, stdout, stderr){
    if (err) {
        console.log("child processes failed with error code: " +
            err.code);
    }
    console.log(stdout);
    console.log(stderr);
});

cc.on('error', function(){
    print('got error');
});

var spawn = require('child_process').execFile;
var ls = spawn('perl', ['p.pl']);

ls.on('error', function(){
    print('got error');
});

ls.stdout.on('data', function(data){
	ls.stdin.write("again\n");
  console.log('stdout: ', data);
});

ls.stderr.on('data', function(data){
  console.log('stderr: ', data.toString());
});

ls.on('close', function(code){
  console.log('child process exited with code :', code);
});

ls.on('error', function(code){
  console.log('child Error :', code);
});
