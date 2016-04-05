'use strict';

require('../common');
var assert = require('assert');
var http = require('http');
//FIXME: https
// var https = require('https');
var error = 'Unable to determine the domain name';

function test(host) {
  ['get', 'request'].forEach( function(method) {
    [http].forEach( function(module) {
      assert.throws( function() {
      	module[method](host, function() {
        	throw new Error(module + ' ' + method + 'should not connect to ' + host);
    	});
      }, error);
    });
  });
}

['www.nodejs.org', 'localhost', '127.0.0.1', 'http://:80/'].forEach(test);
