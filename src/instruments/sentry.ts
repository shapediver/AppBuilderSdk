import {IErrorReportingContext} from "@AppBuilderLib/shared/lib/ErrorReportingContext.types";
import {
	getEnvironmentIdentifier,
	isRunningInPlatform,
} from "@AppBuilderLib/shared/lib/platform/environment";
import * as Sentry from "@sentry/react";
import packagejson from "../../package.json";
import {CONFIG} from "../../sentryconfig";

const sentryConfig = CONFIG as typeof CONFIG & {SENTRY_RELEASE?: string};

export const SENTRY_RELEASE =
	sentryConfig.SENTRY_RELEASE ??
	`${packagejson.version}+${CONFIG.SENTRY_RELEASE_TIMESTAMP}`;

if (CONFIG.SENTRY_DSN && isRunningInPlatform()) {
	Sentry.init({
		dsn: CONFIG.SENTRY_DSN,
		environment: getEnvironmentIdentifier(),
		release: SENTRY_RELEASE,
	});
}

export const SentryErrorReportingContext: IErrorReportingContext = {
	captureException: function (exception: any): string {
		return Sentry.captureException(exception);
	},
	captureMessage: function (msg: string): string {
		return Sentry.captureMessage(msg);
	},
};
