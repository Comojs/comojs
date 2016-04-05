/**
* @module http-parser
* @author Mamod A. Mehyar
* @license MIT
******************************************************************************/
"use strict";

var parser = process.binding('http-parser');
var assert = require('assert');


var headersNum = 0;
var lastHeaderfield = '';
var lastHeaderValue = '';

/** @constructor
  * @alias module:http-parser
  * @param type {Constant} http parsing type [ <b>parser.REQUEST</b> |
  * <b>parser.RESPONSE</b> | <b>parser.BOTH</b> ]
  *
  * @example
  * var parser = require('http-parser');
  * var p = new parser(parser.RESPONSE);
  *
  * var HTTPResponse = "POST /example HTTP/1.1\r\n"  +
  *                    "Host: example.com\r\n"       +
  *                    "Content-Type: text/html\r\n" +
  *                    "Content-Length: 2\r\n\r\n"   +
  *                    "Hi";
  *
  * var nread = p.parse(HTTPResponse);
  * console.log(p.method);  // log method type
  * console.log(p.path);    // log response path
  * console.log(p.headers); // log response headers
  * p.on_status = function(val){
  *     console.log(val);
  * };
  *
  * @returns {Object} an http parser object
  *
******************************************************************************/
function HTTPParser (type){
	type = type || 0;
	this.headers = {};
	this._headers = [];
	this._headerFields = [];
	this._headerValues = [];

	this.body = '';
	this.url = '';
	var pointer = parser.init(type, this);
	this.pointer = pointer;
	this.type = type;
	if (pointer === null) {
		throw new Error("out of memory while creating new Http parser");
	}
	return this;
}

HTTPParser.prototype._reset = function(){
	headersNum = 0;
	lastHeaderfield = '';
	lastHeaderValue = '';

	this.status_message = '';
	this._headers = [];
	this._headerFields = [];
	this._headerValues = [];

	this._headerFields.length = 0;
	this._headerValues.length = 0;
	this._headers.length = 0;

	this.headers = {};
	this.url = '';
}

HTTPParser.prototype._check_message = function(r){
	if (!r){
		this.got_exception = true;
		return -1;
	}
	return 0;
};

/** parse http strings, on error return an instance of Error object,
  * other wise number of bytes parsed so far will be returned
  *
  * @function
  * @param type {String} http string (either a response or request string)
  *
  * @returns {Number} number of parsed bytes
  *
******************************************************************************/
HTTPParser.prototype.execute = HTTPParser.prototype.parse = function (str, len){
	str = String(str); //make sure it's a string
	len = len || str.length;
	var nparsed = parser.execute(this.pointer, str, len);
	if (!this.upgrade() && nparsed !== len) {
		var cb = this[HTTPParser.kOnExecute];
		var err  = Error('Parse Error');
		err.bytesRead = nparsed;
		if (!cb) return err;
		cb.call(this, err);
		return err;
	}

	return nparsed;
};

/** Reinitialize parser type so you can use it on different http headers
  * [response / request] without a need to reconstruct a new http-parser
  * object
  *
  * @function
  * @param type {Constant} http parsing type [ <b>parser.REQUEST</b> |
  * <b>parser.RESPONSE</b> | <b>parser.BOTH</b> ]
  *
  * @example
  * var p = new parser(parser.RESPONSE);
  * //do some response header parsing ...
  * p.reinitialize(parser.REQUEST);
  * //do some request headers parsing ...
  *
******************************************************************************/
HTTPParser.prototype.reinitialize = function (type){
	assert(type == parser.HTTP_REQUEST ||
		   type == parser.HTTP_RESPONSE);

	this._reset();
	this.type = type;
	parser.reinitialize(this.pointer, type);
};


/** Will be called every time the parser parses header field name
  * and should be followed by on_header_value callback
  *
  * @ignore
  * @function on_header_field
  * @param value {String} header field name
  *
  * @returns {Number} [1|0] return 1 to continue parsing, 0 to stop the parser
  *
******************************************************************************/
HTTPParser.prototype.on_header_field = function (value){
	lastHeaderfield = lastHeaderfield + value;
};

/** Will be called every time the parser parses header field name
  * and should be followed by on_header_value callback
  *
  * @ignore
  * @function on_header_value
  * @param value {String} header field name
  *
  * @returns {Number} [1|0] return 1 to continue parsing, 0 to stop the parser
  *
******************************************************************************/

HTTPParser.prototype.on_header_value = function (value){
	if (lastHeaderfield !== ''){
		this._headers.push(lastHeaderfield);
		headersNum = this._headers.length;
		lastHeaderValue = lastHeaderfield;
		this.headers[lastHeaderfield] = '';
		lastHeaderfield = '';
		this._headers[headersNum] = '';
	}
	this.headers[lastHeaderValue] += value;
	this._headers[headersNum] += value;
};


HTTPParser.prototype.on_url = function (value){
	this.url = this.url + value;
};


HTTPParser.prototype.on_status = function (msg){
	this.status_message = msg;
};


HTTPParser.prototype.on_body = function (val){
	this.body += val;
	var cb = this[HTTPParser.kOnBody];
	if (!cb) return 0;
	var r = cb.call(this, val, 0, val.length);
	return this._check_message(r);
};


HTTPParser.prototype.on_message_begin = function (){
	this._reset();
};


HTTPParser.prototype.on_headers_complete = function (){

	var message_info = {};
	var headers = this._headers;
	var cb = this[HTTPParser.kOnHeadersComplete];
	if (!cb) return 0;

	var statusCode, statusMessage, url, method;
	if (this.type === parser.HTTP_REQUEST) {
		url = this.url;
		method = this.method();
	}

	// STATUS
	if (this.type === parser.HTTP_RESPONSE) {
		statusCode = this.status_code();
		statusMessage = this.status_message;
	}

	// VERSION
	var versionMajor = this.versionMajor();
	var versionMinor = this.versionMinor();
	var shouldKeepAlive = this.shouldKeepAlive();
	var upgrade = this.upgrade();


	var head_response = cb.call(this, versionMajor, versionMinor, headers, method,
	                               url, statusCode, statusMessage, upgrade,
	                               shouldKeepAlive);

	//reset
	this._headers.length = 0;
	this.headers = [];
	this.headers.length = 0;
	this.url = '';
	lastHeaderfield = '';
	headersNum = 0;

	if (head_response !== 0 && !head_response){
		this.got_exception = true;
		return -1;
	}

	return head_response ? 1 : 0;
};


HTTPParser.prototype.Flush = function (){
	var cb = this[HTTPParser.kOnHeaders];
	if (!cb) return;
	cb.call(this, this._headers, this.url);
	this.flushed = true;
	this.url = '';
};


HTTPParser.prototype.on_message_complete = function (){
	if (this._headers.length) this.Flush();
	var cb = this[HTTPParser.kOnMessageComplete];
	if (!cb) return 0;
	var r = cb.call(this, 0);
	return this._check_message(r);
};


HTTPParser.prototype.shouldKeepAlive = function (){
	return parser.http_should_keep_alive(this.pointer);
};


HTTPParser.prototype.upgrade = function (){
	return parser.http_upgrade(this.pointer);
};


HTTPParser.prototype.versionMinor = function (){
	return parser.http_minor(this.pointer);
};


HTTPParser.prototype.versionMajor = function (){
	return parser.http_major(this.pointer);
};


HTTPParser.prototype.method = function (){
	return parser.http_method(this.pointer);
};


HTTPParser.prototype.status_code = function (){
	return parser.status_code(this.pointer);
};


HTTPParser.prototype.finish = function (){
	this._reset();
	return 0;
};


HTTPParser.prototype.close = function (){
	parser.destroy(this.pointer);
};

/** @constant REQUEST  */ HTTPParser.REQUEST  = parser.HTTP_REQUEST;
/** @constant RESPONSE */ HTTPParser.RESPONSE = parser.HTTP_RESPONSE;
/** @constant BOTH     */ HTTPParser.BOTH     = parser.HTTP_BOTH;

//compatable with node
HTTPParser.methods = parser.methods();


HTTPParser.kOnHeaders = 0;
HTTPParser.kOnHeadersComplete = 1;
HTTPParser.kOnBody = 2;
HTTPParser.kOnMessageComplete = 3;
HTTPParser.kOnExecute = 4;

HTTPParser.HTTPParser = HTTPParser;

module.exports = HTTPParser;
