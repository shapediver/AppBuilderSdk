/** Jest stub for `*.module.css` and plain `*.css` imports. */
const cssModule = new Proxy(
	{},
	{
		get: (_target, prop) => (prop === "__esModule" ? false : String(prop)),
	},
);

export default cssModule;
