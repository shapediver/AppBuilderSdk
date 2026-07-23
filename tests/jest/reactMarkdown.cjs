const React = require("react");

function Markdown({children}) {
	return React.createElement("div", null, children);
}

module.exports = Markdown;
module.exports.default = Markdown;
