import {ITrackerContext} from "@AppBuilderShared/types/context/trackercontext";
import {Logger} from "@AppBuilderShared/utils/logger";
import reportWebVitals from "reportWebVitals";

export const setupWebVitalsTracking = (tracker: ITrackerContext) => {
	reportWebVitals((r) => {
		const {name, value, rating} = r;
		tracker.trackMetric("Web vitals", name, value, {props: {rating}});
		Logger.debug("reportWebVitals", r);
	});
};
