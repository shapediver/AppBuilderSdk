import {spawnSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const GIT_SETTINGS = {
	"git.autoRepositoryDetection": true,
	"git.detectSubmodules": true,
	"git.repositoryScanMaxDepth": 2,
	"git.scanRepositories": ["src/shared"],
};

const SESSION_CONTEXT = [
	"AppBuilderSdk worktree bootstrap:",
	"- `src/shared` is the AppBuilderShared git repo. Changes there only appear in the Changes panel if that repo is scanned (`git.scanRepositories: [\"src/shared\"]`) or added as a workspace folder.",
	"- If `src/shared` is empty, run `git submodule update --init -- src/shared` before other work.",
	"- Shared git commands: `git -C src/shared ...`. Use branch `task/JIRA-ISSUE-ID` in both repos.",
].join("\n");

function readStdin() {
	try {
		const raw = fs.readFileSync(0, "utf8").trim();
		return raw ? JSON.parse(raw) : {};
	} catch {
		return {};
	}
}

function projectRoot() {
	return (
		process.env.CURSOR_PROJECT_DIR ||
		process.env.CLAUDE_PROJECT_DIR ||
		process.cwd()
	);
}

function ensureGitSettings(root) {
	const vscodeDir = path.join(root, ".vscode");
	const settingsPath = path.join(vscodeDir, "settings.json");
	fs.mkdirSync(vscodeDir, {recursive: true});

	let settings = {};
	if (fs.existsSync(settingsPath)) {
		try {
			settings = JSON.parse(fs.readFileSync(settingsPath, "utf8"));
		} catch {
			settings = {};
		}
	}

	let changed = false;
	for (const [key, value] of Object.entries(GIT_SETTINGS)) {
		if (JSON.stringify(settings[key]) !== JSON.stringify(value)) {
			settings[key] = value;
			changed = true;
		}
	}

	if (changed) {
		fs.writeFileSync(
			settingsPath,
			`${JSON.stringify(settings, null, "\t")}\n`,
		);
	}
}

function sharedNeedsInit(root) {
	const shared = path.join(root, "src", "shared");
	if (!fs.existsSync(shared)) {
		return true;
	}
	try {
		const names = fs.readdirSync(shared).filter((name) => name !== ".git");
		const gitFile = path.join(shared, ".git");
		return names.length === 0 && !fs.existsSync(gitFile);
	} catch {
		return true;
	}
}

function initSharedSubmodule(root) {
	if (!sharedNeedsInit(root)) {
		return;
	}
	spawnSync("git", ["submodule", "update", "--init", "--", "src/shared"], {
		cwd: root,
		stdio: "ignore",
		timeout: 170000,
		windowsHide: true,
	});
}

const input = readStdin();
const root = projectRoot();

try {
	ensureGitSettings(root);
	initSharedSubmodule(root);
} catch {
	// Fail open: workspace open / session start must not block.
}

if (input.hook_event_name === "sessionStart") {
	process.stdout.write(
		JSON.stringify({additional_context: SESSION_CONTEXT}),
	);
} else {
	process.stdout.write("{}");
}
