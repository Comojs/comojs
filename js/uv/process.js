var isWin = process.platform === 'win32';
module.exports = isWin ? require('uv/process/windows') :
                         require('uv/process/unix');
