import RootComponent from "@AppBuilderShared/components/RootComponent";
import "instruments/sentry";
import React from "react";
import ReactDOM from "react-dom/client";
import {PlausibleTracker} from "~/instruments/plausible";
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
