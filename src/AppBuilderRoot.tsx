import RootComponent from "@AppBuilderShared/components/RootComponent";
import AppBuilderAttributeVisualizationWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderAttributeVisualizationWidgetComponent";
import ParameterDraggingComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterDraggingComponent";
import ParameterDrawingComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterDrawingComponent";
import ParameterGumballComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterGumballComponent";
import ParameterSelectionComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterSelectionComponent";
import ViewportComponent from "@AppBuilderShared/components/shapediver/viewport/ViewportComponent";
import ViewportIcons from "@AppBuilderShared/components/shapediver/viewport/ViewportIcons";
import ViewportOverlayWrapper from "@AppBuilderShared/components/shapediver/viewport/ViewportOverlayWrapper";
import {IComponentContext} from "@AppBuilderShared/types/context/componentcontext";
import {isAttributeVisualizationWidget} from "@AppBuilderShared/types/shapediver/appbuilder";
import {PARAMETER_TYPE} from "@shapediver/viewer.session";
import "instruments/sentry";
import React from "react";
import ReactDOM from "react-dom/client";
import AppBuilderBase from "~/AppBuilderBase";
import {PlausibleTracker} from "~/instruments/plausible";
import {setupWebVitalsTracking} from "~/instruments/webvitals";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);

const components: IComponentContext = {
	viewportComponent: {component: ViewportComponent},
	viewportOverlayWrapper: {component: ViewportOverlayWrapper},
	viewportIcons: {component: ViewportIcons},
	parameters: {
		[PARAMETER_TYPE.DRAWING]: {
			component: ParameterDrawingComponent,
			extraBottomPadding: true,
		},
		[PARAMETER_TYPE.INTERACTION]: {
			selection: {
				component: ParameterSelectionComponent,
				extraBottomPadding: true,
			},
			gumball: {
				component: ParameterGumballComponent,
				extraBottomPadding: true,
			},
			dragging: {
				component: ParameterDraggingComponent,
				extraBottomPadding: false,
			},
		},
	},
	widgets: {
		attributeVisualization: {
			isComponent: isAttributeVisualizationWidget,
			component: AppBuilderAttributeVisualizationWidgetComponent,
		},
	},
};

root.render(
	<RootComponent
		useStrictMode={false}
		tracker={PlausibleTracker}
		componentContext={components}
	>
		<AppBuilderBase />
	</RootComponent>,
);

PlausibleTracker.trackPageview();
setupWebVitalsTracking(PlausibleTracker);
