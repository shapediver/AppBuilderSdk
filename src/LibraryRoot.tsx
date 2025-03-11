import RootComponent from "@AppBuilderShared/components/RootComponent";
import "instruments/sentry";
import React from "react";
import ReactDOM from "react-dom/client";
import {PlausibleTracker} from "~/instruments/plausible";
import {setupWebVitalsTracking} from "~/instruments/webvitals";
import LibraryBase from "~/LibraryBase";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);

root.render(
	<RootComponent useStrictMode={false} tracker={PlausibleTracker}>
		<LibraryBase />
	</RootComponent>,
);

PlausibleTracker.trackPageview();
setupWebVitalsTracking(PlausibleTracker);
