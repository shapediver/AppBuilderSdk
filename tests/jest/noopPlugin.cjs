function noopPlugin() {
	return function noopTransformer() {};
}

module.exports = noopPlugin;
module.exports.default = noopPlugin;
