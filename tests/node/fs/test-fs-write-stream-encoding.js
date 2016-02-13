'use strict';
var common = require('../common');
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var stream = require('stream');
var firstEncoding = 'base64';
var secondEncoding = 'binary';

var examplePath = path.join(common.fixturesDir, 'x.txt');
var dummyPath = path.join(common.tmpDir, 'x.txt');

common.refreshTmpDir();

var exampleReadStream = fs.createReadStream(examplePath, {
  encoding: firstEncoding
});

var dummyWriteStream = fs.createWriteStream(dummyPath, {
  encoding: firstEncoding
});

exampleReadStream.pipe(dummyWriteStream).on('finish', function() {
  var assertWriteStream = new stream.Writable({
    write: function(chunk, enc, next) {
      var expected = new Buffer('xyz\n');
      assert(chunk.equals(expected));
    }
  });
  assertWriteStream.setDefaultEncoding(secondEncoding);
  fs.createReadStream(dummyPath, {
    encoding: secondEncoding
  }).pipe(assertWriteStream);
});
