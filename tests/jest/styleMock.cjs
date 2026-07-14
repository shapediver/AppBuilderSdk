module.exports = new Proxy(
	{},
	{
		get: (_target, property) =>
			typeof property === "string" ? property : undefined,
	},
);
