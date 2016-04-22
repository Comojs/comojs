Comojs
------

Tiny server side javascript framework using [Duktape](http://duktape.org) javascript engine.
The final goal is to be ``100%`` compatibile with ``nodejs API`` and friendly with embedded devices


Philosophy
----------
* Everthing Should by as tiny as possible
* Implement most things in javascript
* Must maintaine a low footprint memory usage
* Should run without compilation using tinycc compiler
* Should compile with libmusl
* Fast compilation time, current compilation time ~ 3 seconds (without embdTLS)


design
-------
To be fully compatible with nodejs api the easiest thing to do is using nodejs modules as is and then write wrappers in javascript to emulate libuv and node C++ wrappers see ``js/uv`` and ``js/node_wrapper`` folders, this contributed to reduce performance but also speed the development process, I may rethink this approach once we pass the tests :)


Compile
-------

You need to have perl installed, no make files at the moment, just run

> perl scripts/make.pl

This will build comojs with mbedTLS library, and since there is no TLS bindings
at the moment, you maybe better compile without mbedTLS

> perl scripts/make.pl -DCOMO_NO_TLS

Running Without Compilation
---------------------------

In order to run using Tinycc without compilation you need first to install Tinycc and make sure it's in your environment path

Then, just compile Duktape and mbedTLS libraries as they are going to be linked, I couldn't get these to run under Tinycc!!

so run

> perl scripts/duktape.pl && perl scripts/mbedtls.pl

Now you can run comojs

> ./como.sh

or on windows

> como

you can run tests with

> perl test.pl

Please note that performance will never match nodejs for 2 main reasons
========================================================================

1 - nodejs use V8 which is a JIT-based javascript engine, duktape isn't, duktape was designed for portability and memory constrained devices

2 - nodejs use libuv for it's event loop and c++ wrappers to bridge with javascript, comojs use a tiny event loop and all wrappers written in pure javascript for simplicity, I only used C for things that can't be done in Javascript.

node modules
=============
- [x] buffer
- [x] timers
- [x] net
- [x] child_process
- [x] dns (partial)
- [x] tty
- [x] http
- [ ] https
