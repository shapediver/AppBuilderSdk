import RootComponent from "@AppBuilderShared/components/RootComponent";
import AppBuilderActionCameraComponent from "@AppBuilderShared/components/shapediver/appbuilder/actions/AppBuilderActionCameraComponent";
import AppBuilderAttributeVisualizationWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderAttributeVisualizationWidgetComponent";
import AppBuilderSceneTreeExplorerWidgetComponent from "@AppBuilderShared/components/shapediver/appbuilder/widgets/AppBuilderSceneTreeExplorerWidgetComponent";
import {NumberAttributeThemeProps} from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/NumberAttribute";
import {StringAttributeThemeProps} from "@AppBuilderShared/components/shapediver/appbuilder/widgets/attributes/StringAttribute";
import ParameterDraggingComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterDraggingComponent";
import ParameterDrawingComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterDrawingComponent";
import ParameterGumballComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterGumballComponent";
import ParameterSelectionComponent from "@AppBuilderShared/components/shapediver/parameter/ParameterSelectionComponent";
import ViewportAnchor2d, {
	ViewportAnchor2dThemeProps,
} from "@AppBuilderShared/components/shapediver/viewport/anchors/ViewportAnchor2d";
import ViewportAnchor3d, {
	ViewportAnchor3dThemeProps,
} from "@AppBuilderShared/components/shapediver/viewport/anchors/ViewportAnchor3d";
import ArButton from "@AppBuilderShared/components/shapediver/viewport/buttons/ArButton";
import CamerasButton from "@AppBuilderShared/components/shapediver/viewport/buttons/CamerasButton";
import FullscreenButton from "@AppBuilderShared/components/shapediver/viewport/buttons/FullscreenButton";
import HistoryMenuButton from "@AppBuilderShared/components/shapediver/viewport/buttons/HistoryMenuButton";
import RedoButton from "@AppBuilderShared/components/shapediver/viewport/buttons/RedoButton";
import ReloadButton from "@AppBuilderShared/components/shapediver/viewport/buttons/ReloadButton";
import UndoButton from "@AppBuilderShared/components/shapediver/viewport/buttons/UndoButton";
import ZoomButton from "@AppBuilderShared/components/shapediver/viewport/buttons/ZoomButton";
import ViewportComponent from "@AppBuilderShared/components/shapediver/viewport/ViewportComponent";
import ViewportIcons from "@AppBuilderShared/components/shapediver/viewport/ViewportIcons";
import ViewportOverlayWrapper from "@AppBuilderShared/components/shapediver/viewport/ViewportOverlayWrapper";
import {IComponentContext} from "@AppBuilderShared/types/context/componentcontext";
import {
	AppBuilderContainerNameType,
	isAttributeVisualizationWidget,
	isCameraAction,
	isSceneTreeExplorerWidget,
} from "@AppBuilderShared/types/shapediver/appbuilder";
import {ViewportIconButtonEnum} from "@AppBuilderShared/types/shapediver/viewportIcons";
import {PARAMETER_TYPE} from "@shapediver/viewer.session";
import "instruments/sentry";
import React from "react";
import ReactDOM from "react-dom/client";
import AppBuilderBase from "~/AppBuilderBase";
import {PlausibleTracker} from "~/instruments/plausible";
import {setupWebVitalsTracking} from "~/instruments/webvitals";
import {SentryErrorReportingContext} from "./instruments/sentry";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);

const components: IComponentContext = {
	viewportAnchors: {
		[AppBuilderContainerNameType.Anchor2d]: {
			component: ViewportAnchor2d,
			themeProps: ViewportAnchor2dThemeProps,
		},
		[AppBuilderContainerNameType.Anchor3d]: {
			component: ViewportAnchor3d,
			themeProps: ViewportAnchor3dThemeProps,
		},
	},
	viewportComponent: {component: ViewportComponent},
	viewportOverlayWrapper: {component: ViewportOverlayWrapper},
	viewportIcons: {component: ViewportIcons},
	viewportIconButtons: {
		[ViewportIconButtonEnum.Ar]: {component: ArButton},
		[ViewportIconButtonEnum.Zoom]: {component: ZoomButton},
		[ViewportIconButtonEnum.Cameras]: {component: CamerasButton},
		[ViewportIconButtonEnum.Fullscreen]: {component: FullscreenButton},
		[ViewportIconButtonEnum.Undo]: {component: UndoButton},
		[ViewportIconButtonEnum.Redo]: {component: RedoButton},
		[ViewportIconButtonEnum.Reload]: {component: ReloadButton},
		[ViewportIconButtonEnum.HistoryMenu]: {component: HistoryMenuButton},
	},
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
			themeProps: {
				NumberAttribute: NumberAttributeThemeProps,
				StringAttribute: StringAttributeThemeProps,
			},
		},
		sceneTreeExplorer: {
			isComponent: isSceneTreeExplorerWidget,
			component: AppBuilderSceneTreeExplorerWidgetComponent,
		},
	},
	actions: {
		camera: {
			isAction: isCameraAction,
			component: AppBuilderActionCameraComponent,
		},
	},
};

root.render(
	<RootComponent
		useStrictMode={false}
		tracker={PlausibleTracker}
		errorReporting={SentryErrorReportingContext}
		componentContext={components}
	>
		<AppBuilderBase />
	</RootComponent>,
);

PlausibleTracker.trackPageview();
setupWebVitalsTracking(PlausibleTracker);
