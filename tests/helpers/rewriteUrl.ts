/**
 * Rewrites an App URL from the /latest/ deployment to a specific branch.
 *
 * Handles both URL shapes used across 11-AppBuilder and BETA:
 *   https://appbuilder.shapediver.com/v1/main/latest/?slug=...
 *   https://www.shapediver.com/app/builder/v1/main/latest/?slug=...
 *
 * The segment `/main/latest/` becomes `/main/<branch>/`.
 */
export function rewriteToTestBranch(url: string, branch: string): string {
	return url.replace("/main/latest/", `/main/${branch}/`);
}
