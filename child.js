var uv = require('uv');
var sock = require('socket');

function on_child_exit (status){
    console.log("closed with status " + status);
    // console.log(this);
    this.in.close();
    this.out.close(function(){
    	print('closeddddd');
    });
}

function start () {
    print("spawn_test\n");

    var args = [];
    args[0] = "perl p.pl";
    args[1] = null;
    args[2] = null;

    var apipe = new uv.Pipe(0);
    var bpipe = new uv.Pipe(0);
    // var s = uv.socket(sock.AF_INET, sock.SOCK_STREAM, 0);
    // apipe.open(0);

    var options = {};
    options.stdio_count = 3;
    var child_stdio = uv.stdio_container(3);

    child_stdio[0].flags = uv.CREATE_PIPE | uv.WRITABLE_PIPE;
    child_stdio[0].stream = bpipe;

    child_stdio[1].flags = uv.CREATE_PIPE | uv.READABLE_PIPE;
    child_stdio[1].stream = apipe;

    // child_stdio[2].flags = uv.IGNORE;
    child_stdio[2].flags = uv.INHERIT_FD;
    child_stdio[2].fd    = 2;

    options.stdio = child_stdio;

    options.exit_cb = on_child_exit;
    options.file = args[0];
    options.args = args;

    // console.log(options);
    var p = uv.spawn(options);
    p.in = apipe;
    p.out = bpipe;

    apipe.read_start(function(err, buf){
        print(err);
        print(buf);
        bpipe.write("hi thereeeee\n");
    });

    // setInterval(function(){
    //     console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
    // }, 1);
}

start();
start();
start();
start();
start();
start();
start();
start();


// setInterval(function(){
//     print('hi');
// }, 1000);
