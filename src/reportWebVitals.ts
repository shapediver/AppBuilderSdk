import { onCLS, onINP, onFCP, onLCP, onTTFB, MetricType } from "web-vitals";

type ReportHandler = (metric: MetricType) => void

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
	if (onPerfEntry && onPerfEntry instanceof Function) {
		onCLS(onPerfEntry);
		onINP(onPerfEntry);
		onFCP(onPerfEntry);
		onLCP(onPerfEntry);
		onTTFB(onPerfEntry);
	}
};

export default reportWebVitals;
