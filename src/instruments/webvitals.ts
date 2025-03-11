import {ITrackerContext} from "@AppBuilderShared/types/context/trackercontext";
import reportWebVitals from "reportWebVitals";

export const setupWebVitalsTracking = (tracker: ITrackerContext) => {
	reportWebVitals((r) => {
		const {name, value, rating} = r;
		tracker.trackMetric("Web vitals", name, value, {props: {rating}});
		console.debug("reportWebVitals", r);
	});
};
