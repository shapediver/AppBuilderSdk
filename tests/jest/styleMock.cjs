module.exports = new Proxy(
	{},
	{
		get: (_target, property) => {
			if (property === "__esModule") return false;
			return typeof property === "string" ? property : undefined;
		},
	},
);
