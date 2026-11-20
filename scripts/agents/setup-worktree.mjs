// Tool-neutral worktree setup. Idempotent and fast, so every tool can run it on session start.
//   node scripts/agents/setup-worktree.mjs [--no-copy]
// 1. Copy local, gitignored files listed in .worktreeinclude from the main checkout (skips existing files).
//    Same semantics as Claude Code's .worktreeinclude: gitignore syntax, only files that are also gitignored.
// 2. Init the src/shared submodule when it is empty.
// 3. Run `pnpm install` unless a complete install exists (skip with --no-install).
//    Steps 2 and 3 run under a lock in the git dir, so parallel hook runs don't collide.
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

// Hooks pipe their event and close stdin at once. A shell that leaves stdin open (an agent running the
// script by hand) would block a synchronous read forever, so stop waiting after 2 s.
function readStdin() {
	if (process.stdin.isTTY) return Promise.resolve({});
	return new Promise((resolve) => {
		let raw = "";
		const done = () => {
			clearTimeout(timer);
			process.stdin.pause();
			try {
				resolve(raw.trim() ? JSON.parse(raw) : {});
			} catch {
				resolve({});
			}
		};
		const timer = setTimeout(done, 2000);
		process.stdin.setEncoding("utf8");
		process.stdin.on("data", (chunk) => (raw += chunk));
		process.stdin.on("end", done);
		process.stdin.on("error", done);
	});
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

const LOCK_STALE_MS = 600000; // the hook timeout

// One run at a time: Cursor fires workspaceOpen, sessionStart and setup-worktree together on a new
// worktree. The lock lives in the worktree's git dir; a lock older than the hook timeout is stale.
function takeLock(gitDir) {
	const file = path.join(gitDir, "agent-setup.lock");
	try {
		if (Date.now() - fs.statSync(file).mtimeMs > LOCK_STALE_MS)
			fs.rmSync(file, {force: true});
	} catch {}
	try {
		fs.closeSync(fs.openSync(file, "wx"));
	} catch {
		return null;
	}
	return () => fs.rmSync(file, {force: true});
}

// Without node_modules, prettier/eslint/tsc and the format-on-edit hook can't run. pnpm links from its
// global store, so a fresh install is fast; later runs skip this step. pnpm writes .modules.yaml at
// the end of an install, so a killed or failed install is retried.
function installDeps(root) {
	if (fs.existsSync(path.join(root, "node_modules", ".modules.yaml"))) return;
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

const input = await readStdin();
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
const gitDir = git(root, ["rev-parse", "--path-format=absolute", "--git-dir"]);
let release = null;

for (const step of [
	() =>
		!process.argv.includes("--no-copy") &&
		path.resolve(main) !== path.resolve(root) &&
		copyIncluded(root, main),
	() => {
		if (!gitDir) return;
		release = takeLock(gitDir);
		if (!release)
			log.push(
				"warning: another setup run is initializing src/shared or installing; it finishes in the background",
			);
	},
	() => release && initShared(root),
	() =>
		release && !process.argv.includes("--no-install") && installDeps(root),
	() => ensureGitSettings(root),
]) {
	try {
		step();
	} catch (e) {
		log.push(`warning: ${e.message}`); // fail open: session start must not block
	}
}
release?.();

const warnings = log.filter((l) => l.startsWith("warning"));
const context = warnings.length
	? `${SESSION_CONTEXT}\n- Setup warnings: ${warnings.join("; ")}`
	: SESSION_CONTEXT;
const event = input.hook_event_name;
if (event === "sessionStart") {
	process.stdout.write(JSON.stringify({additional_context: context})); // Cursor
} else if (event === "SessionStart") {
	process.stdout.write(
		JSON.stringify({
			hookSpecificOutput: {
				hookEventName: "SessionStart",
				additionalContext: context,
			},
		}),
	); // Claude Code, Codex
} else if (event) {
	process.stdout.write("{}");
} else {
	console.log(log.length ? log.join("\n") : "worktree already set up");
}
