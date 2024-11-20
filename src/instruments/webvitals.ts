import reportWebVitals from "reportWebVitals";
import { ITrackerContext } from "shared/types/context/trackercontext";

export const setupWebVitalsTracking = (tracker: ITrackerContext) => {
	reportWebVitals(r => {
		const {name, value, rating} = r;
		tracker.trackMetric("Web vitals", name, value, { props: { rating } });
		console.debug("reportWebVitals", r);
	});
};
