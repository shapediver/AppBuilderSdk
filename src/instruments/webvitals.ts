import {ITrackerContext} from "@AppBuilderLib/shared/lib/TrackerContext.types";
import {Logger} from "@AppBuilderLib/shared/lib/logger";
import reportWebVitals from "reportWebVitals";

export const setupWebVitalsTracking = (tracker: ITrackerContext) => {
	reportWebVitals((r) => {
		const {name, value, rating} = r;
		tracker.trackMetric("Web vitals", name, value, {props: {rating}});
		Logger.debug("reportWebVitals", r);
	});
};
