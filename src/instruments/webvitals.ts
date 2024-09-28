import reportWebVitals from "reportWebVitals";
import { ITrackerContext } from "shared/types/context/trackercontext";

function roundToBracket(value: number, _bracket: number | undefined): number {
	const bracket = _bracket ?? 100;
	
	return Math.ceil(value / bracket) * bracket;
}

const mapMetricToBracket = {
	"CLS": 0.1,
	"FCP": 250,
	"FID": 50,
	"INP": 50,
	"LCP": 250,
	"TTFB": 100
};

export const setupWebVitalsTracking = (tracker: ITrackerContext) => {
	reportWebVitals(r => {
		const {name, value, rating} = r;
		const propNameValue = `${name}-val`;
		const propNameRating = `${name}-rat`;
		tracker.trackEvent("Web vitals", { props: { 
			[propNameValue]: roundToBracket(value, mapMetricToBracket[name]), 
			[propNameRating]: rating,
		}});
		console.debug("reportWebVitals", r);
	});
};
