import {IErrorReportingContext} from "@AppBuilderShared/types/context/errorreportingcontext";
import * as Sentry from "@sentry/react";
import {
	getEnvironmentIdentifier,
	isRunningInPlatform,
} from "~/shared/shared/lib/platform";
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

export const SentryErrorReportingContext: IErrorReportingContext = {
	captureException: function (exception: any): string {
		return Sentry.captureException(exception);
	},
	captureMessage: function (msg: string): string {
		return Sentry.captureMessage(msg);
	},
};
