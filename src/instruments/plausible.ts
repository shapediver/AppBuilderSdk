import Plausible from "plausible-tracker";
import { combineTrackers, setDefaultTrackerProps } from "shared/context/TrackerContext";
import { ITrackerContext } from "shared/types/context/trackercontext";
import { DEFAULT_TRACKING_PARAMS, QUERYPARAM_TRACKING_DOMAIN } from "shared/types/shapediver/queryparams";
import { isRunningInPlatform } from "shared/utils/platform/environment";

// default tracking domain
const domain = isRunningInPlatform() ? "appbuilder.platform" : "appbuilder.shapediver.com";
const apiHost = isRunningInPlatform() ? window.location.origin : "https://appbuilder.shapediver.com";
const hashMode = false;
const trackLocalhost = false;

// default plausible tracker
let tracker: ITrackerContext = Plausible({
	hashMode,
	trackLocalhost,
	apiHost,
	domain,
});

// default properties to be tracked
const defaultProps: {[key: string]: any} = {};
const params = new URLSearchParams(window.location.search);
DEFAULT_TRACKING_PARAMS.forEach(p => {
	if (params.get(p)) {
		defaultProps[p] = params.get(p);
	}
});

// optional secondary plausible tracker
if (params.get(QUERYPARAM_TRACKING_DOMAIN)) {
	const domain2nd = params.get(QUERYPARAM_TRACKING_DOMAIN);
	if (domain2nd && domain2nd !== domain) {
		const plausible2nd = Plausible({
			hashMode,
			trackLocalhost,
			apiHost,
			domain: domain2nd,
		});
		tracker = combineTrackers([tracker, plausible2nd]);
	}
}

// assign default properties to tracker
export const PlausibleTracker: ITrackerContext = setDefaultTrackerProps(tracker, defaultProps);
