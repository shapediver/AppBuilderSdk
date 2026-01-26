import {
	combineTrackers,
	DelayedTrackerPropsAwaiter,
	setDefaultTrackerProps,
} from "@AppBuilderShared/context/TrackerContext";
import {ITrackerContext} from "@AppBuilderShared/types/context/trackercontext";
import {
	DEFAULT_TRACKING_PARAMS,
	QUERYPARAM_TRACKING_DOMAIN,
} from "@AppBuilderLib/shared/config/queryparams";
import {Logger} from "@AppBuilderShared/utils/logger";
import {roundToBracket} from "@AppBuilderShared/utils/numerics";
import Plausible from "plausible-tracker";
import {PlausibleInitOptions} from "plausible-tracker/build/main/lib/tracker";
import {isRunningInPlatform} from "~/shared/shared/lib/platform";

// default tracking domain
const domain = isRunningInPlatform()
	? "appbuilder.platform"
	: "appbuilder.shapediver.com";
const apiHost = isRunningInPlatform()
	? window.location.origin
	: "https://appbuilder.shapediver.com";
const hashMode = false;
const trackLocalhost = false;

const mapMetricToBracket = {
	CLS: 0.1,
	FCP: 250,
	FID: 50,
	INP: 50,
	LCP: 250,
	TTFB: 100,
};

function createPlausibleTracker(
	options: PlausibleInitOptions,
): ITrackerContext {
	const plausible = Plausible(options);
	const delayedPropsAwaiter = new DelayedTrackerPropsAwaiter();

	return {
		trackPageview: function (eventData, options) {
			plausible.trackPageview(eventData, options);
		},
		trackEvent: function (eventName, options) {
			plausible.trackEvent(eventName, options);
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
				plausible.trackEvent(type, {
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
let tracker = createPlausibleTracker({
	hashMode,
	trackLocalhost,
	apiHost,
	domain,
});

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
			hashMode,
			trackLocalhost,
			apiHost,
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
