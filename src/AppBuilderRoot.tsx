import "instruments/sentry";
import React from "react";
import ReactDOM from "react-dom/client";
import AppBuilderBase from "AppBuilderBase";
import RootComponent from "shared/components/RootComponent";
import { PlausibleTracker } from "instruments/plausible";
import { setupWebVitalsTracking } from "instruments/webvitals";
import { IComponentContext } from "shared/types/context/componentcontext";
import { PARAMETER_TYPE } from "@shapediver/viewer.session";
import ParameterDraggingComponent from "shared/components/shapediver/parameter/ParameterDraggingComponent";
import ParameterDrawingComponent from "shared/components/shapediver/parameter/ParameterDrawingComponent";
import ParameterGumballComponent from "shared/components/shapediver/parameter/ParameterGumballComponent";
import ParameterSelectionComponent from "shared/components/shapediver/parameter/ParameterSelectionComponent";
import ViewportComponent from "shared/components/shapediver/viewport/ViewportComponent";
import ViewportOverlayWrapper from "shared/components/shapediver/viewport/ViewportOverlayWrapper";
import ViewportIcons from "shared/components/shapediver/viewport/ViewportIcons";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement
);

const components: IComponentContext = {
	viewportComponent: { component: ViewportComponent },
	viewportOverlayWrapper: { component: ViewportOverlayWrapper },
	viewportIcons: { component: ViewportIcons },
	parameters: {
		[PARAMETER_TYPE.DRAWING]: { component: ParameterDrawingComponent, extraBottomPadding: true },
		[PARAMETER_TYPE.INTERACTION]: {
			"selection": { component: ParameterSelectionComponent, extraBottomPadding: true },
			"gumball": { component: ParameterGumballComponent, extraBottomPadding: true },
			"dragging": { component: ParameterDraggingComponent, extraBottomPadding: false },
		}
	}
};

root.render(
	<RootComponent
		useStrictMode={false}
		tracker={PlausibleTracker}
		componentContext={components}
	>
		<AppBuilderBase />
	</RootComponent>
);

PlausibleTracker.trackPageview();
setupWebVitalsTracking(PlausibleTracker);
