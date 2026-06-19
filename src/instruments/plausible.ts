import {
	DEFAULT_TRACKING_PARAMS,
	QUERYPARAM_TRACKING_DOMAIN,
} from "@AppBuilderLib/shared/config/queryparams";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {roundToBracket} from "@AppBuilderLib/shared/lib/numerics";
import {isRunningInPlatform} from "@AppBuilderLib/shared/lib/platform/environment";
import {
	DelayedTrackerPropsAwaiter,
	setDefaultTrackerProps,
} from "@AppBuilderLib/shared/lib/TrackerContext";
import {ITrackerContext} from "@AppBuilderLib/shared/lib/TrackerContext.types";
import {
	PlausibleConfig,
	init as PlausibleInit,
	PlausibleRequestPayload,
	track,
} from "@plausible-analytics/tracker";

// default tracking domain

const domain = isRunningInPlatform()
	? "appbuilder.platform"
	: "appbuilder.shapediver.com";
const apiHost = isRunningInPlatform()
	? window.location.origin
	: "https://appbuilder.shapediver.com";
const defaultOptions: PlausibleConfig = {
	endpoint: `${apiHost}/api/event`,
	hashBasedRouting: false,
	captureOnLocalhost: false,
	bindToWindow: false,
	autoCapturePageviews: false,
	domain,
};
const mapMetricToBracket = {
	CLS: 0.1,
	FCP: 250,
	FID: 50,
	INP: 50,
	LCP: 250,
	TTFB: 100,
};

function createPlausibleTracker(options: PlausibleConfig): ITrackerContext {
	PlausibleInit(options);
	const delayedPropsAwaiter = new DelayedTrackerPropsAwaiter();

	return {
		trackPageview: function (eventData, options) {
			track("pageview", {...eventData, ...options});
		},
		trackEvent: function (eventName, options) {
			track(eventName, {...options});
		},
		trackMetric(type, metricName, value, options) {
			const {rating, ...props} = options?.props ?? {};
			const {callback = undefined} = options ?? {};
			if (type === "Web vitals") {
				const name = metricName as
					| "CLS"
					| "FCP"
					| "FID"
					| "INP"
					| "LCP"
					| "TTFB";
				const propNameValue = `${name}-val`;
				const propNameRating = `${name}-rat`;
				track(type, {
					props: {
						...props,
						[propNameValue]: roundToBracket(
							value,
							mapMetricToBracket[name],
						),
						[propNameRating]: rating,
					},
					callback,
				});
			} else {
				Logger.warn(`Unknown metric type: ${type}`);
			}
		},
		delayedPropsAwaiter,
	};
}

const defaultProps: {[key: string]: any} = {};
const params = new URLSearchParams(window.location.search);
DEFAULT_TRACKING_PARAMS.forEach((p) => {
	if (params.get(p)) {
		defaultProps[p] = params.get(p);
	}
});

// plausible tracker options
const domainFromParams = params.get(QUERYPARAM_TRACKING_DOMAIN);
const domain2nd =
	domainFromParams && domainFromParams !== domain ? domainFromParams : null;
const options = domain2nd
	? {
			...defaultOptions,
			transformRequest: (payload: PlausibleRequestPayload) => {
				const payload2nd = {
					...payload,
					d: domain2nd,
				};
				fetch(`${apiHost}/api/event`, {
					method: "POST",
					body: JSON.stringify(payload2nd),
					headers: {
						"Content-Type": "application/json",
					},
				}).catch(() => undefined);

				return payload;
			},
		}
	: defaultOptions;
const tracker = createPlausibleTracker(options);

// assign default properties to tracker
export const PlausibleTracker: ITrackerContext = setDefaultTrackerProps(
	tracker,
	defaultProps,
);
