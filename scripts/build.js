var fs = require('fs');

var content = fs.readFileSync('./src/ModulesMap.json');
var map = JSON.parse(content);
var hFile = {
	fileMap : {}
};

function to_c_header(str){
	var str = JSON.stringify(str);
	str = str.replace(/\\/g, '\\\\');
	str = str.replace(/\"/g, '\\"');
	str = '"' + str + '"';
	return str + '\n';
}

for (var key in map){
	var file = map[key];
	var fContent = process.readFile(file);
	hFile[key] = fContent;
	hFile.fileMap[key] = file;
}

var main_file = to_c_header(hFile.main);
delete hFile.main;

var native_source = to_c_header(hFile);


fs.writeFile("./src/js/como_native_modules.h", native_source, function(err) {
	if(err) {
		return console.log(err);
	}

	console.log("Native modules c header Saved!");
});

fs.writeFile("./src/js/como_main_js.h", main_file, function(err) {
	if(err) {
		return console.log(err);
	}

	console.log("main js c header Saved!");
});
