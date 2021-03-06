// 'use strict';
var common = require('../common');
var assert = require('assert');
var fs = require('fs');
var join = require('path').join;

common.refreshTmpDir();

var filename = join(common.tmpDir, 'test.txt');

var n = 220;
var s = '南越国是前203年至前111年存在于岭南地区的一个国家，国都位于番禺，疆域包括今天中国的广东、' +
        '广西两省区的大部份地区，福建省、湖南、贵州、云南的一小部份地区和越南的北部。' +
        '南越国是秦朝灭亡后，由南海郡尉赵佗于前203年起兵兼并桂林郡和象郡后建立。' +
        '前196年和前179年，南越国曾先后两次名义上臣属于西汉，成为西汉的“外臣”。前112年，' +
        '南越国末代君主赵建德与西汉发生战争，被汉武帝于前111年所灭。南越国共存在93年，' +
        '历经五代君主。南越国是岭南地区的第一个有记载的政权国家，采用封建制和郡县制并存的制度，' +
        '它的建立保证了秦末乱世岭南地区社会秩序的稳定，有效的改善了岭南地区落后的政治、##济现状。\n';

var ncallbacks = 0;
var b = new Buffer(s);
console.log(b.byteLength);

fs.writeFile(filename, s, function(e) {
  if (e) throw e;

  ncallbacks++;

  fs.readFile(filename, function(e, buffer) {
    if (e) throw e;
    ncallbacks++;
    // console.log(buffer.toString());
    assert.equal(Buffer.byteLength(s), buffer.length);
  });
});

// test that writeFile accepts buffers
var filename2 = join(common.tmpDir, 'test2.txt');
var buf = new Buffer(s, 'utf8');

fs.writeFile(filename2, buf, function(e) {
  if (e) throw e;

  ncallbacks++;

  fs.readFile(filename2, function(e, buffer) {
    if (e) throw e;
    ncallbacks++;
    assert.equal(buf.length, buffer.length);
  });
});

// test that writeFile accepts numbers.
var filename3 = join(common.tmpDir, 'test3.txt');

var m = 0600;
fs.writeFile(filename3, n, { mode: m }, function(e) {
  if (e) throw e;

  // windows permissions aren't unix
  if (!common.isWindows) {
    var st = fs.statSync(filename3);
    assert.equal(st.mode & 0700, m);
  }

  ncallbacks++;

  fs.readFile(filename3, function(e, buffer) {
    if (e) throw e;
    ncallbacks++;
    assert.equal(Buffer.byteLength('' + n), buffer.length);
  });
});

// test that writeFile accepts file descriptors
var filename4 = join(common.tmpDir, 'test4.txt');
var buf = new Buffer(s, 'utf8');

fs.open(filename4, 'w+', function(e, fd) {
  if (e) throw e;

  ncallbacks++;

  fs.writeFile(fd, s, function(e) {
    if (e) throw e;

    ncallbacks++;

    fs.close(fd, function(e) {
      if (e) throw e;

      ncallbacks++;

      fs.readFile(filename4, function(e, buffer) {
        if (e) throw e;

        ncallbacks++;
        assert.equal(Buffer.byteLength(s), buffer.length);
      });
    });
  });
});

process.on('exit', function() {
  assert.equal(10, ncallbacks);

  fs.unlinkSync(filename);
  fs.unlinkSync(filename2);
  fs.unlinkSync(filename3);
  fs.unlinkSync(filename4);
});
