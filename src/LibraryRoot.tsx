import RootComponent from "@AppBuilderLib/shared/ui/root/RootComponent";
import ReactDOM from "react-dom/client";
import {PlausibleTracker} from "~/instruments/plausible";
import "~/instruments/sentry";
import {setupWebVitalsTracking} from "~/instruments/webvitals";
import LibraryBase from "~/LibraryBase";
import {SentryErrorReportingContext} from "./instruments/sentry";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);

root.render(
	<RootComponent
		useStrictMode={false}
		tracker={PlausibleTracker}
		errorReporting={SentryErrorReportingContext}
	>
		<LibraryBase />
	</RootComponent>,
);

PlausibleTracker.trackPageview();
setupWebVitalsTracking(PlausibleTracker);
