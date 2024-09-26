import "instruments/sentry";
import React from "react";
import ReactDOM from "react-dom/client";
import AppBuilderBase from "AppBuilderBase";
import RootComponent from "shared/components/RootComponent";
import { PlausibleTracker } from "instruments/plausible";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
	<RootComponent 
		useStrictMode={false}
		tracker={PlausibleTracker}
	>
		<AppBuilderBase/>
	</RootComponent>
);
