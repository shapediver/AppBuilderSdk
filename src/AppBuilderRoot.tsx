import "instruments/sentry";
import React from "react";
import ReactDOM from "react-dom/client";
import AppBuilderBase from "AppBuilderBase";
import RootComponent from "shared/components/RootComponent";
import { PlausibleTracker } from "instruments/plausible";
import { setupWebVitalsTracking } from "instruments/webvitals";
import { IComponentContext } from "shared/types/context/componentcontext";
import { PARAMETER_TYPE, EXPORT_TYPE } from "@shapediver/viewer.session";
import ExportButtonComponent from "shared/components/shapediver/exports/ExportButtonComponent";
import ParameterBooleanComponent from "shared/components/shapediver/parameter/ParameterBooleanComponent";
import ParameterColorComponent from "shared/components/shapediver/parameter/ParameterColorComponent";
import ParameterDraggingComponent from "shared/components/shapediver/parameter/ParameterDraggingComponent";
import ParameterDrawingComponent from "shared/components/shapediver/parameter/ParameterDrawingComponent";
import ParameterFileInputComponent from "shared/components/shapediver/parameter/ParameterFileInputComponent";
import ParameterGumballComponent from "shared/components/shapediver/parameter/ParameterGumballComponent";
import ParameterSelectComponent from "shared/components/shapediver/parameter/ParameterSelectComponent";
import ParameterSelectionComponent from "shared/components/shapediver/parameter/ParameterSelectionComponent";
import ParameterSliderComponent from "shared/components/shapediver/parameter/ParameterSliderComponent";
import ParameterStringComponent from "shared/components/shapediver/parameter/ParameterStringComponent";
import ViewportComponent from "shared/components/shapediver/viewport/ViewportComponent";
import ViewportOverlayWrapper from "shared/components/shapediver/viewport/ViewportOverlayWrapper";
import ViewportIcons from "shared/components/shapediver/viewport/ViewportIcons";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const components: IComponentContext = {
	viewportComponent: ViewportComponent,
	viewportOverlayWrapper: ViewportOverlayWrapper,
	viewportIcons: ViewportIcons,
	parameters: {
		[PARAMETER_TYPE.INT]: {component: ParameterSliderComponent, extraBottomPadding: true},
		[PARAMETER_TYPE.FLOAT]: {component: ParameterSliderComponent, extraBottomPadding: true},
		[PARAMETER_TYPE.EVEN]: {component: ParameterSliderComponent, extraBottomPadding: true},
		[PARAMETER_TYPE.ODD]: {component: ParameterSliderComponent, extraBottomPadding: true},
		[PARAMETER_TYPE.BOOL]: {component: ParameterBooleanComponent, extraBottomPadding: false},
		[PARAMETER_TYPE.STRING]: {component: ParameterStringComponent, extraBottomPadding: false},
		[PARAMETER_TYPE.STRINGLIST]: {component: ParameterSelectComponent, extraBottomPadding: false},
		[PARAMETER_TYPE.COLOR]: {component: ParameterColorComponent, extraBottomPadding: false},
		[PARAMETER_TYPE.FILE]: {component: ParameterFileInputComponent, extraBottomPadding: false},
		[PARAMETER_TYPE.DRAWING]: {component: ParameterDrawingComponent, extraBottomPadding: true},
		[PARAMETER_TYPE.INTERACTION]: {
			"selection": {component: ParameterSelectionComponent, extraBottomPadding: true},
			"gumball": {component: ParameterGumballComponent, extraBottomPadding: true},
			"dragging": {component: ParameterDraggingComponent, extraBottomPadding: false},
		}
	},
	exports: {
		[EXPORT_TYPE.DOWNLOAD]: ExportButtonComponent,
		[EXPORT_TYPE.EMAIL]: ExportButtonComponent,
	}
};

root.render(
	<RootComponent 
		useStrictMode={false}
		tracker={PlausibleTracker}
		componentContext={components}
	>
		<AppBuilderBase/>
	</RootComponent>
);

PlausibleTracker.trackPageview();
setupWebVitalsTracking(PlausibleTracker);
