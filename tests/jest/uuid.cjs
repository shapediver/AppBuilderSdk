const NIL = "00000000-0000-0000-0000-000000000000";
const MAX = "ffffffff-ffff-ffff-ffff-ffffffffffff";

function v4() {
	return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
		(
			Number(c) ^
			(Math.floor(Math.random() * 256) & (15 >> (Number(c) / 4)))
		).toString(16),
	);
}

function validate(value) {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
		value,
	);
}

function version(value) {
	if (!validate(value)) throw new TypeError("Invalid UUID");
	return Number.parseInt(value[14], 16);
}

function parse(value) {
	if (!validate(value)) throw new TypeError("Invalid UUID");
	return Uint8Array.from(value.replace(/-/g, "").match(/.{1,2}/g).map((byte) => Number.parseInt(byte, 16)));
}

function stringify(bytes) {
	const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

module.exports = {
	MAX,
	NIL,
	parse,
	stringify,
	validate,
	version,
	v1: v4,
	v3: v4,
	v4,
	v5: v4,
	v6: v4,
	v7: v4,
};
