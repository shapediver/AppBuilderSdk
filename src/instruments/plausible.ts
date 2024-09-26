import Plausible from "plausible-tracker";
import { ITrackerContext } from "shared/types/context/trackercontext";
import { isRunningInPlatform } from "shared/utils/platform/environment";

const plausible = Plausible({
	hashMode: false,
	trackLocalhost: true,
	apiHost: isRunningInPlatform() ? window.location.origin : "https://appbuilder.shapediver.com",
	domain: isRunningInPlatform() ? "appbuilder.platform" : "appbuilder.shapediver.com",
});

export const PlausibleTracker: ITrackerContext = plausible;
