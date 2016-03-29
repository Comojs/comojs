var syscall = require('syscall');
var C = require('C');
var sock = require('socket');

var dt = new Date;
for (var i = 0; i < 5000; i++){
	var res = syscall.LookupIP("yahoo.com");
	// console.log(res);
}

var end = +new Date - dt;
console.log('1- time taken: ' + end);
