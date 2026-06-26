/** Jest CJS stub for uuid@14 (ESM-only) used by @shapediver/viewer in unit tests. */
const NIL = "00000000-0000-0000-0000-000000000000";
const MAX = "ffffffff-ffff-ffff-ffff-ffffffffffff";

function v4() {
	return "00000000-0000-4000-8000-000000000001";
}

module.exports = {
	NIL,
	MAX,
	parse: () => ({}),
	stringify: () => NIL,
	validate: () => true,
	version: () => 4,
	v1: v4,
	v3: v4,
	v4,
	v5: v4,
	v6: v4,
	v7: v4,
};
