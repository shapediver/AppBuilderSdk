import {
	getEnvironmentIdentifier,
	isRunningInPlatform,
} from "@AppBuilderShared/utils/platform/environment";
import * as Sentry from "@sentry/react";
import packagejson from "../../package.json";
import {CONFIG} from "../../sentryconfig";

export const SENTRY_RELEASE = `${packagejson.version}+${CONFIG.SENTRY_RELEASE_TIMESTAMP}`;

if (CONFIG.SENTRY_DSN && isRunningInPlatform()) {
	Sentry.init({
		dsn: CONFIG.SENTRY_DSN,
		environment: getEnvironmentIdentifier(),
		release: SENTRY_RELEASE,
	});
}
