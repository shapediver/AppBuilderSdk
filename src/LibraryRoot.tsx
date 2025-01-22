import "instruments/sentry";
import React from "react";
import ReactDOM from "react-dom/client";
import LibraryBase from "~/LibraryBase";
import RootComponent from "@AppBuilderShared/components/RootComponent";
import { PlausibleTracker } from "~/instruments/plausible";
import { setupWebVitalsTracking } from "~/instruments/webvitals";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
	<RootComponent
		useStrictMode={false}
		tracker={PlausibleTracker}
	>
		<LibraryBase/>
	</RootComponent>
);

PlausibleTracker.trackPageview();
setupWebVitalsTracking(PlausibleTracker);
