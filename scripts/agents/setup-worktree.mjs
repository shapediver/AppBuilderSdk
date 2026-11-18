// Tool-neutral worktree setup. Idempotent and fast, so every tool can run it on session start.
//   node scripts/agents/setup-worktree.mjs [--no-copy]
// 1. Copy local, gitignored files listed in .worktreeinclude from the main checkout (skips existing files).
//    Same semantics as Claude Code's .worktreeinclude: gitignore syntax, only files that are also gitignored.
// 2. Init the src/shared submodule when it is empty.
// 3. Run `pnpm install` when node_modules is missing (skip with --no-install).
// 4. Write the .vscode/settings.json git keys so src/shared diffs show in the IDE.
// Called by: .claude/settings.json and .codex/hooks.json (SessionStart), .cursor/hooks.json (sessionStart,
// workspaceOpen), .cursor/worktrees.json (setup-worktree). Prints hook output when stdin carries a hook event.
import {spawnSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const GIT_SETTINGS = {
	"git.autoRepositoryDetection": true,
	"git.detectSubmodules": true,
	"git.repositoryScanMaxDepth": 2,
	"git.scanRepositories": ["src/shared"],
};
const SKIP_DIRS = [
	"node_modules",
	".git",
	".claude/worktrees",
	"dist",
	"playwright-report",
	"test-results",
];
const SESSION_CONTEXT = [
	"AppBuilderSdk worktree setup ran (scripts/agents/setup-worktree.mjs):",
	"- `src/shared` is the AppBuilderShared git repo. Shared git commands: `git -C src/shared ...`. Use branch `task/<KEY>` in both repos.",
	"- If `src/shared` is still empty, run `git submodule update --init -- src/shared` before other work.",
].join("\n");

const log = [];

function git(cwd, args, input) {
	const r = spawnSync("git", args, {
		cwd,
		input,
		encoding: "utf8",
		windowsHide: true,
		timeout: 170000,
	});
	return r.status === 0 ? r.stdout.trim() : null;
}

function readStdin() {
	if (process.stdin.isTTY) return {};
	try {
		const raw = fs.readFileSync(0, "utf8").trim();
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

// .worktreeinclude line -> glob relative to the repo root (gitignore semantics, simplified)
function toGlob(pattern) {
	let p = pattern.replace(/\\/g, "/");
	const dir = p.endsWith("/");
	p = p.replace(/\/+$/, "");
	const anchored = p.startsWith("/") || p.includes("/");
	p = p.replace(/^\/+/, "");
	if (!anchored && !p.startsWith("**/")) p = `{${p},**/${p}}`;
	return dir ? `${p}/**` : p;
}

function copyIncluded(root, main) {
	const listFile = path.join(root, ".worktreeinclude");
	if (!fs.existsSync(listFile)) return;
	const lines = fs
		.readFileSync(listFile, "utf8")
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter((l) => l && !l.startsWith("#"));
	const exclude = (f) =>
		SKIP_DIRS.some(
			(d) => f === d || f.startsWith(`${d}/`) || f.includes(`/${d}/`),
		);
	const opts = {
		cwd: main,
		exclude: (f) => exclude(String(f).replace(/\\/g, "/")),
	};
	const files = new Set();
	for (const line of lines) {
		const negate = line.startsWith("!");
		for (const f of fs.globSync(
			toGlob(negate ? line.slice(1) : line),
			opts,
		)) {
			const rel = f.replace(/\\/g, "/");
			if (!fs.statSync(path.join(main, rel)).isFile()) continue;
			negate ? files.delete(rel) : files.add(rel);
		}
	}
	if (!files.size) return;
	// Only gitignored files, so tracked files are never overwritten.
	const ignored = new Set(
		(git(main, ["check-ignore", "--stdin"], [...files].join("\n")) ?? "")
			.split(/\r?\n/)
			.filter(Boolean),
	);
	for (const rel of files) {
		if (!ignored.has(rel)) continue;
		const dest = path.join(root, rel);
		if (fs.existsSync(dest)) continue;
		fs.mkdirSync(path.dirname(dest), {recursive: true});
		fs.copyFileSync(path.join(main, rel), dest);
		log.push(`copied ${rel}`);
	}
}

function ensureGitSettings(root) {
	const file = path.join(root, ".vscode", "settings.json");
	let settings = {};
	try {
		settings = JSON.parse(fs.readFileSync(file, "utf8"));
	} catch {}
	const missing = Object.entries(GIT_SETTINGS).filter(
		([k, v]) => JSON.stringify(settings[k]) !== JSON.stringify(v),
	);
	if (!missing.length) return;
	fs.mkdirSync(path.dirname(file), {recursive: true});
	fs.writeFileSync(
		file,
		`${JSON.stringify({...settings, ...GIT_SETTINGS}, null, "\t")}\n`,
	);
	log.push("wrote .vscode/settings.json");
}

function initShared(root) {
	const shared = path.join(root, "src", "shared");
	const empty =
		!fs.existsSync(shared) ||
		fs.readdirSync(shared).filter((n) => n !== ".git").length === 0;
	if (!empty) return;
	git(root, ["submodule", "update", "--init", "--", "src/shared"]);
	log.push("initialized src/shared");
}

// Without node_modules, prettier/eslint/tsc and the format-on-edit hook can't run. pnpm links from its
// global store, so a fresh install is fast; later runs skip this step.
function installDeps(root) {
	if (fs.existsSync(path.join(root, "node_modules"))) return;
	// One command string: pnpm is a .cmd shim on Windows and needs a shell.
	const r = spawnSync("pnpm install --frozen-lockfile --prefer-offline", {
		cwd: root,
		stdio: "ignore",
		shell: true,
		windowsHide: true,
		timeout: 540000,
	});
	log.push(
		r.status === 0
			? "installed dependencies (pnpm install)"
			: `warning: pnpm install failed (exit ${r.status}); run it by hand`,
	);
}

const input = readStdin();
const start =
	process.env.CLAUDE_PROJECT_DIR ||
	process.env.CURSOR_PROJECT_DIR ||
	input.cwd ||
	process.cwd();
const root = git(start, ["rev-parse", "--show-toplevel"]) ?? start;
const commonDir = git(root, [
	"rev-parse",
	"--path-format=absolute",
	"--git-common-dir",
]);
const main = commonDir ? path.dirname(commonDir) : root;

for (const step of [
	() =>
		!process.argv.includes("--no-copy") &&
		path.resolve(main) !== path.resolve(root) &&
		copyIncluded(root, main),
	() => initShared(root),
	() => !process.argv.includes("--no-install") && installDeps(root),
	() => ensureGitSettings(root),
]) {
	try {
		step();
	} catch (e) {
		log.push(`warning: ${e.message}`); // fail open: session start must not block
	}
}

const event = input.hook_event_name;
if (event === "sessionStart") {
	process.stdout.write(JSON.stringify({additional_context: SESSION_CONTEXT})); // Cursor
} else if (event === "SessionStart") {
	process.stdout.write(
		JSON.stringify({
			hookSpecificOutput: {
				hookEventName: "SessionStart",
				additionalContext: SESSION_CONTEXT,
			},
		}),
	); // Claude Code, Codex
} else if (event) {
	process.stdout.write("{}");
} else {
	console.log(log.length ? log.join("\n") : "worktree already set up");
}
