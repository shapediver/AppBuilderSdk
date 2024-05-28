const PROD_PLATFORM_HOST = "shapediver.com";
const STAGING_PLATFORM_HOST = "staging-wwwcdn.us-east-1.shapediver.com";
const DEV_PLATFORM_HOST = "dev-wwwcdn.us-east-1.shapediver.com";
const SANDBOX_PLATFORM_HOST = "sandbox-wwwcdn.us-east-1.shapediver.com";

/**
 * Get the default platform URL based on the current hostname.
 * @returns 
 */
export function getDefaultPlatformUrl() {
	if (isRunningInPlatform())
		return origin;

	return `https://${PROD_PLATFORM_HOST}`;
}

/**
 * Test whether the application is running embedded in the ShapeDiver platform. 
 */
export function isRunningInPlatform() {
	const hostname = window.location.hostname;
	if (hostname === STAGING_PLATFORM_HOST || hostname === "staging-spa.us-east-1.shapediver.com")
		return true;
	else if (hostname === DEV_PLATFORM_HOST || hostname === "dev-spa.us-east-1.shapediver.com")
		return true;
	else if (hostname === SANDBOX_PLATFORM_HOST || hostname === "sandbox-spa.us-east-1.shapediver.com")
		return true;
	else if (hostname === PROD_PLATFORM_HOST || hostname === "www.shapediver.com")
		return true;

	return false;
}

/**
 * Get an identifier for the environment depending on the current hostname.
 */
export function getEnvironmentIdentifier() {
	const hostname = window.location.hostname;
	if (hostname === STAGING_PLATFORM_HOST || hostname === "staging-spa.us-east-1.shapediver.com")
		return "staging";
	else if (hostname === DEV_PLATFORM_HOST || hostname === "dev-spa.us-east-1.shapediver.com")
		return "development";
	else if (hostname === SANDBOX_PLATFORM_HOST || hostname === "sandbox-spa.us-east-1.shapediver.com")
		return "sandbox";
	else if (hostname === PROD_PLATFORM_HOST || hostname === "www.shapediver.com")
		return "production";

	return "unknown";
}