import {execFileSync, execSync} from "child_process";
import * as fs from "fs";
import * as path from "path";
import {fetchAppLinks} from "./helpers/fetchAppLinks";
import {fetchTestingAccountLinks} from "./helpers/fetchTestingAccountLinks";

/**
 * Playwright global setup — runs once before all tests.
 *
 * 1. Fetches public App Builder links from rendered GrasshopperExampleModels
 *    pages and testing-account links from the Platform API, then caches them
 *    to tests/config/.app-links.json.
 *
 * 2. Optionally deploys the current HEAD to TEST_BRANCH (default: testing/local).
 *    Deployment is explicit in CI via APPBUILDER_E2E_DEPLOY=1. For local
 *    backwards compatibility, deployment still runs by default unless
 *    SKIP_DEPLOY=1 is set.
 *
 * Requirements:
 *   - PLATFORM_CLIENT_ID, PLATFORM_ACCESS_TOKEN_KEY, and
 *     PLATFORM_ACCESS_TOKEN_SECRET must be set for testing-account discovery.
 *   - When deploying, working tree tracked files must be clean (enforced by
 *     publish script).
 *   - AWS credentials and APPBUILDER_BUCKET must be set in the environment.
 *
 * Overrides:
 *   - SKIP_DEPLOY=1 bypasses deployment unconditionally.
 *   - APPBUILDER_E2E_DEPLOY=1 opts into deployment explicitly (required in CI).
 *   - APPBUILDER_E2E_SKIP_INSTALL=1 prevents global setup from running pnpm i.
 */
export default async function globalSetup() {
	// Fetch app links from public rendered documentation and cache to a JSON file.
	// globalSetup runs before Playwright evaluates spec files, so the spec can
	// read the JSON synchronously at module load time to generate one
	// test.describe per slug — enabling full parallelism across all examples.
	console.log("[global-setup] Fetching public App Builder links...");
	const publicLinks = await fetchAppLinks();
	console.log(
		"[global-setup] Fetching owned app links from the ShapeDiver testing account...",
	);
	const testingAccountLinks = await fetchTestingAccountLinks();
	const links = new Map(publicLinks.map((link) => [link.slug, link]));
	for (const link of testingAccountLinks) links.set(link.slug, link);
	const allLinks = [...links.values()];
	const linksPath = path.resolve("tests/config/.app-links.json");
	fs.writeFileSync(linksPath, JSON.stringify(allLinks, null, 2));
	console.log(
		`[global-setup] Cached ${allLinks.length} app links to ${linksPath} ` +
			`(${publicLinks.length} public, ${testingAccountLinks.length} testing-account).`,
	);

	if (process.env.SKIP_DEPLOY === "1") {
		console.log("[global-setup] SKIP_DEPLOY=1 — skipping deploy.");
		return;
	}

	const explicitDeploy = process.env.APPBUILDER_E2E_DEPLOY === "1";
	const isCi = process.env.CI === "true" || process.env.CI === "1";
	if (isCi && !explicitDeploy) {
		console.log(
			"[global-setup] CI detected without APPBUILDER_E2E_DEPLOY=1 — skipping deploy.",
		);
		return;
	}

	if (!explicitDeploy && !isCi) {
		console.log(
			"[global-setup] Local run without SKIP_DEPLOY=1 — preserving legacy deploy behavior.",
		);
	}

	const TEST_BRANCH = process.env.TEST_BRANCH ?? "testing/local";
	// Tag name written by build-appbuilder.sh: "AppBuilder${MAIN_TARGET^}@$branch"
	// MAIN_TARGET="main" → "AppBuilderMain@testing/local"
	const DEPLOY_TAG = `AppBuilderMain@${TEST_BRANCH}`;

	const currentCommit = execFileSync("git", ["rev-parse", "HEAD"], {
		encoding: "utf8",
	}).trim();

	// Fetch the tag from remote so we don't miss a deploy done on another machine.
	try {
		execFileSync(
			"git",
			[
				"fetch",
				"origin",
				`refs/tags/${DEPLOY_TAG}:refs/tags/${DEPLOY_TAG}`,
				"--force",
			],
			{stdio: "pipe"},
		);
	} catch {
		// Tag may not exist on remote yet — that's fine, we'll deploy below.
	}

	// Check if the tag already points to the current commit.
	// Use `git rev-list -n 1 refs/tags/<tag>` instead of `git rev-parse <tag>^{}`
	// because cmd.exe on Windows treats `^` as an escape character, swallowing `^{}`
	// before git ever sees it — making rev-parse always throw and the skip never trigger.
	// `rev-list -n 1` walks through any annotated tag object and returns the commit SHA.
	let taggedCommit: string | null = null;
	try {
		taggedCommit = execFileSync(
			"git",
			["rev-list", "-n", "1", `refs/tags/${DEPLOY_TAG}`],
			{
				encoding: "utf8",
				stdio: "pipe",
			},
		).trim();
	} catch {
		// Tag doesn't exist locally.
	}

	if (taggedCommit === currentCommit) {
		console.log(
			`[global-setup] '${DEPLOY_TAG}' already points to ${currentCommit.slice(0, 8)} — skipping deploy.`,
		);
		return;
	}

	// Remember where we started so we can restore afterwards.
	const originalBranch = execSync("git rev-parse --abbrev-ref HEAD", {
		encoding: "utf8",
	}).trim();

	console.log(
		`[global-setup] Current branch: ${originalBranch}. Creating/resetting '${TEST_BRANCH}' to current HEAD.`,
	);

	// Guard: if the testing branch already exists and has commits that are not
	// reachable from HEAD, a force-reset would permanently lose them.
	let testingBranchExists = false;
	try {
		execFileSync("git", ["rev-parse", "--verify", TEST_BRANCH], {
			stdio: "pipe",
		});
		testingBranchExists = true;
	} catch {
		// Branch doesn't exist yet — safe to create.
	}

	if (testingBranchExists) {
		const diverged = execFileSync(
			"git",
			["log", `HEAD..${TEST_BRANCH}`, "--oneline"],
			{
				encoding: "utf8",
				stdio: "pipe",
			},
		).trim();

		if (diverged) {
			throw new Error(
				`[global-setup] Aborting: branch '${TEST_BRANCH}' has commits that would be ` +
					`lost by resetting it to the current HEAD:\n\n${diverged}\n\n` +
					`Merge, push, or delete '${TEST_BRANCH}' before running tests, ` +
					"or set SKIP_DEPLOY=1 to skip the deploy step entirely.",
			);
		}
	}

	try {
		// Create or force-reset the testing branch to the current commit.
		execFileSync("git", ["checkout", "-B", TEST_BRANCH], {
			stdio: "inherit",
		});

		if (process.env.APPBUILDER_E2E_SKIP_INSTALL === "1" || isCi) {
			console.log("[global-setup] Skipping dependency install in global setup.");
		} else {
			// Install dependencies so the build uses the correct package versions for
			// local legacy runs. CI installs dependencies in the workflow before tests.
			console.log("[global-setup] Installing dependencies...");
			execSync("pnpm i", {stdio: "inherit"});
		}

		// Deploy both URL prefixes (v1/main and app/builder/v1/main).
		console.log(`[global-setup] Deploying branch '${TEST_BRANCH}'...`);
		execSync("pnpm run publish", {
			stdio: "inherit",
			env: {
				...process.env,
				APPBUILDER_ASSUME_YES: process.env.APPBUILDER_ASSUME_YES ?? "1",
			},
		});

		console.log("[global-setup] Deploy complete.");
	} finally {
		// Always restore the original branch, even if deploy failed.
		execFileSync("git", ["checkout", originalBranch], {stdio: "inherit"});
		console.log(`[global-setup] Restored branch '${originalBranch}'.`);
	}
}
