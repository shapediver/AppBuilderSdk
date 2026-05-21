import {execSync} from "child_process";

/**
 * Playwright global setup — runs once before all tests.
 *
 * Creates (or force-resets) the "testing" git branch to the current commit,
 * deploys both AppBuilder prefixes via the existing publish script, then
 * restores the original branch so the working tree is left unchanged.
 *
 * Requirements:
 *   - Working tree must be clean (no uncommitted changes) — the publish
 *     script enforces this and will fail if violated.
 *   - AWS credentials and APPBUILDER_BUCKET must be set in the environment.
 *
 * Skip the deploy step by setting SKIP_DEPLOY=1, useful when the testing
 * branch is already deployed and you just want to re-run the tests.
 */
export default async function globalSetup() {
	if (process.env.SKIP_DEPLOY === "1") {
		console.log(
			"[global-setup] SKIP_DEPLOY=1 — skipping branch creation and deploy.",
		);
		return;
	}

	const TEST_BRANCH = process.env.TEST_BRANCH ?? "testing";

	// Remember where we started so we can restore afterwards
	const originalBranch = execSync("git rev-parse --abbrev-ref HEAD", {
		encoding: "utf8",
	}).trim();

	console.log(
		`[global-setup] Current branch: ${originalBranch}. Creating/resetting '${TEST_BRANCH}' branch to current HEAD.`,
	);

	try {
		// Create or force-reset the testing branch to the current commit,
		// and switch to it. -B = create if absent, reset if present.
		execSync(`git checkout -B ${TEST_BRANCH}`, {stdio: "inherit"});

		// Deploy both URL prefixes (v1/main and app/builder/v1/main)
		console.log(`[global-setup] Deploying branch '${TEST_BRANCH}'...`);
		execSync("pnpm run publish", {stdio: "inherit"});

		console.log(`[global-setup] Deploy complete.`);
	} finally {
		// Always restore the original branch, even if deploy failed
		execSync(`git checkout ${originalBranch}`, {stdio: "inherit"});
		console.log(`[global-setup] Restored branch '${originalBranch}'.`);
	}
}
