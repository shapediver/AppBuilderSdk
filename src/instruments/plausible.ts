import {
	DEFAULT_TRACKING_PARAMS,
	QUERYPARAM_TRACKING_DOMAIN,
} from "@AppBuilderLib/shared/config/queryparams";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import {roundToBracket} from "@AppBuilderLib/shared/lib/numerics";
import {isRunningInPlatform} from "@AppBuilderLib/shared/lib/platform/environment";
import {
	combineTrackers,
	DelayedTrackerPropsAwaiter,
	setDefaultTrackerProps,
} from "@AppBuilderLib/shared/lib/TrackerContext";
import {ITrackerContext} from "@AppBuilderLib/shared/lib/TrackerContext.types";
import {
	PlausibleConfig,
	init as PlausibleInit,
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

// default plausible tracker
let tracker = createPlausibleTracker(defaultOptions);

// default properties to be tracked
const defaultProps: {[key: string]: any} = {};
const params = new URLSearchParams(window.location.search);
DEFAULT_TRACKING_PARAMS.forEach((p) => {
	if (params.get(p)) {
		defaultProps[p] = params.get(p);
	}
});

// optional secondary plausible tracker
if (params.get(QUERYPARAM_TRACKING_DOMAIN)) {
	const domain2nd = params.get(QUERYPARAM_TRACKING_DOMAIN);
	if (domain2nd && domain2nd !== domain) {
		const plausible2nd = createPlausibleTracker({
			...defaultOptions,
			domain: domain2nd,
		});
		tracker = combineTrackers([tracker, plausible2nd]);
	}
}

// assign default properties to tracker
export const PlausibleTracker: ITrackerContext = setDefaultTrackerProps(
	tracker,
	defaultProps,
);
