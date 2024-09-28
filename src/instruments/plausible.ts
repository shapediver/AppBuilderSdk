import Plausible from "plausible-tracker";
import { setDefaultTrackerProps } from "shared/context/TrackerContext";
import { ITrackerContext } from "shared/types/context/trackercontext";
import { isRunningInPlatform } from "shared/utils/platform/environment";

const plausible = Plausible({
	hashMode: false,
	trackLocalhost: false,
	apiHost: isRunningInPlatform() ? window.location.origin : "https://appbuilder.shapediver.com",
	domain: isRunningInPlatform() ? "appbuilder.platform" : "appbuilder.shapediver.com",
});

const defaultProps: {[key: string]: any} = {};

const params = new URLSearchParams(window.location.search);
if (params.get("slug")) {
	defaultProps.slug = params.get("slug");
}

export const PlausibleTracker: ITrackerContext = setDefaultTrackerProps(plausible, defaultProps);
