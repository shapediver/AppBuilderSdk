/** Jest stub for `*.module.css` imports. */
module.exports = new Proxy(
	{},
	{
		get: (_target, prop) => (prop === "__esModule" ? false : String(prop)),
	},
);
