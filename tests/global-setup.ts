import {execSync} from "child_process";

/**
 * Playwright global setup — runs once before all tests.
 *
 * 1. Checks whether the current HEAD commit is already deployed by inspecting
 *    the git tag "AppBuilderMain@<TEST_BRANCH>" created by build-appbuilder.sh.
 *    If the tag points to HEAD, the deploy is skipped entirely.
 *
 * 2. Otherwise: installs dependencies (pnpm i), creates/resets the testing
 *    branch to HEAD, runs the publish script to deploy both AppBuilder prefixes,
 *    then restores the original branch.
 *
 * Requirements when deploying:
 *   - Working tree must be clean (enforced by the publish script).
 *   - AWS credentials and APPBUILDER_BUCKET must be set in the environment.
 *
 * Override: set SKIP_DEPLOY=1 to bypass all of the above unconditionally.
 */
export default async function globalSetup() {
	if (process.env.SKIP_DEPLOY === "1") {
		console.log(
			"[global-setup] SKIP_DEPLOY=1 — skipping branch creation and deploy.",
		);
		return;
	}

	const TEST_BRANCH = process.env.TEST_BRANCH ?? "testing";
	// Tag name written by build-appbuilder.sh: "AppBuilder${MAIN_TARGET^}@$branch"
	// MAIN_TARGET="main" → "AppBuilderMain@testing"
	const DEPLOY_TAG = `AppBuilderMain@${TEST_BRANCH}`;

	const currentCommit = execSync("git rev-parse HEAD", {
		encoding: "utf8",
	}).trim();

	// Fetch the tag from remote so we don't miss a deploy done on another machine
	try {
		execSync(
			`git fetch origin refs/tags/${DEPLOY_TAG}:refs/tags/${DEPLOY_TAG} --force`,
			{stdio: "pipe"},
		);
	} catch {
		// Tag may not exist on remote yet — that's fine, we'll deploy below
	}

	// Check if the tag already points to the current commit.
	// Use `git rev-list -n 1 refs/tags/<tag>` instead of `git rev-parse <tag>^{}`
	// because cmd.exe on Windows treats `^` as an escape character, swallowing `^{}`
	// before git ever sees it — making rev-parse always throw and the skip never trigger.
	// `rev-list -n 1` walks through any annotated tag object and returns the commit SHA.
	let taggedCommit: string | null = null;
	try {
		taggedCommit = execSync(
			`git rev-list -n 1 refs/tags/${DEPLOY_TAG}`,
			{encoding: "utf8", stdio: "pipe"},
		).trim();
	} catch {
		// Tag doesn't exist locally
	}

	if (taggedCommit === currentCommit) {
		console.log(
			`[global-setup] '${DEPLOY_TAG}' already points to ${currentCommit.slice(0, 8)} — skipping deploy.`,
		);
		return;
	}

	// Remember where we started so we can restore afterwards
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
		execSync(`git rev-parse --verify ${TEST_BRANCH}`, {stdio: "pipe"});
		testingBranchExists = true;
	} catch {
		// Branch doesn't exist yet — safe to create
	}

	if (testingBranchExists) {
		const diverged = execSync(`git log HEAD..${TEST_BRANCH} --oneline`, {
			encoding: "utf8",
			stdio: "pipe",
		}).trim();

		if (diverged) {
			throw new Error(
				`[global-setup] Aborting: branch '${TEST_BRANCH}' has commits that would be ` +
					`lost by resetting it to the current HEAD:\n\n${diverged}\n\n` +
					`Merge, push, or delete '${TEST_BRANCH}' before running tests, ` +
					`or set SKIP_DEPLOY=1 to skip the deploy step entirely.`,
			);
		}
	}

	try {
		// Create or force-reset the testing branch to the current commit
		execSync(`git checkout -B ${TEST_BRANCH}`, {stdio: "inherit"});

		// Install dependencies so the build uses the correct package versions
		console.log("[global-setup] Installing dependencies...");
		execSync("pnpm i", {stdio: "inherit"});

		// Deploy both URL prefixes (v1/main and app/builder/v1/main)
		console.log(`[global-setup] Deploying branch '${TEST_BRANCH}'...`);
		execSync("pnpm run publish", {stdio: "inherit"});

		console.log("[global-setup] Deploy complete.");
	} finally {
		// Always restore the original branch, even if deploy failed
		execSync(`git checkout ${originalBranch}`, {stdio: "inherit"});
		console.log(`[global-setup] Restored branch '${originalBranch}'.`);
	}
}
