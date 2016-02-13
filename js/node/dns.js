
exports.lookup = function (hostname, options, callback){
	var cb = callback ? callback : options;
	cb(null, hostname, 4);
	return {};
};
