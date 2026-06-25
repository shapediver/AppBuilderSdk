#!/usr/bin/env node
/**
 * Validate an App Builder settings JSON file (agent / CLI).
 *
 * Usage (from repo root):
 *   pnpm run validate:settings -- public/my-config.json
 *   node scripts/validate-settings-json.mjs public/my-config.json
 *
 * Fast path (~5–15s): tsx runner, no Jest. Times out after 30s.
 * Exits 0 when valid, 1 when invalid, missing file, or timeout.
 */

import {spawn} from "node:child_process";
import {existsSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import process from "node:process";
import {fileURLToPath} from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const RUNNER = join(repoRoot, "scripts/validate-settings-json-runner.ts");
const TIMEOUT_MS = 30_000;

function printUsage() {
	console.error(`Usage: pnpm run validate:settings -- <path-to-json>

Examples:
  pnpm run validate:settings -- public/my-config.json
  pnpm run validate:settings -- public/chair-brand.json

Path is relative to the repo root or absolute.

Do NOT run full pnpm test for single-file checks — use this command only.
Expected runtime: under 30 seconds.`);
}

const arg = process.argv.slice(2).find((a) => a !== "--");

if (!arg || arg === "--help" || arg === "-h") {
	printUsage();
	process.exit(arg ? 0 : 1);
}

const absPath = resolve(repoRoot, arg);

if (!existsSync(absPath)) {
	console.error(`validate-settings-json: file not found: ${absPath}`);
	process.exit(1);
}

const isWin = process.platform === "win32";
const childEnv = {...process.env, VALIDATE_SETTINGS_FILE: absPath};
const child = isWin
	? spawn(`pnpm exec tsx "${RUNNER.replace(/"/g, '\\"')}"`, {
			cwd: repoRoot,
			env: childEnv,
			stdio: "inherit",
			shell: true,
		})
	: spawn("pnpm", ["exec", "tsx", RUNNER], {
			cwd: repoRoot,
			env: childEnv,
			stdio: "inherit",
		});

const timer = setTimeout(() => {
	console.error(
		`\nvalidate-settings-json: timed out after ${TIMEOUT_MS / 1000}s — aborting.`,
	);
	child.kill("SIGTERM");
	process.exit(1);
}, TIMEOUT_MS);

child.on("close", (code) => {
	clearTimeout(timer);
	process.exit(code === 0 ? 0 : 1);
});

child.on("error", (error) => {
	clearTimeout(timer);
	console.error(`validate-settings-json: failed to start: ${error.message}`);
	process.exit(1);
});
