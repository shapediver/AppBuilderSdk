import RootComponent from "@AppBuilderLib/shared/ui/root/RootComponent";
import AppBuilderActionCameraComponent from "@AppBuilderLib/features/appbuilder/ui/AppBuilderActionCameraComponent";
import AppBuilderAttributeVisualizationWidgetComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderAttributeVisualizationWidgetComponent";
import AppBuilderSceneTreeExplorerWidgetComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderSceneTreeExplorerWidgetComponent";
import {NumberAttributeThemeProps} from "@AppBuilderLib/widgets/appbuilder/ui/attributes/NumberAttribute";
import {StringAttributeThemeProps} from "@AppBuilderLib/widgets/appbuilder/ui/attributes/StringAttribute";
import ParameterDraggingComponent from "@AppBuilderLib/entities/parameter/ui/ParameterDraggingComponent";
import ParameterDrawingComponent from "@AppBuilderLib/entities/parameter/ui/ParameterDrawingComponent";
import ParameterGumballComponent from "@AppBuilderLib/entities/parameter/ui/ParameterGumballComponent";
import ParameterSelectionComponent from "@AppBuilderLib/entities/parameter/ui/ParameterSelectionComponent";
import ViewportAnchor2d, {
	ViewportAnchor2dThemeProps,
} from "@AppBuilderLib/entities/viewport-anchor/ui/ViewportAnchor2d";
import ViewportAnchor3d, {
	ViewportAnchor3dThemeProps,
} from "@AppBuilderLib/entities/viewport-anchor/ui/ViewportAnchor3d";
import ArButton from "@AppBuilderLib/entities/viewport/ui/ArButton";
import CamerasButton from "@AppBuilderLib/entities/viewport/ui/CamerasButton";
import FullscreenButton from "@AppBuilderLib/entities/viewport/ui/FullscreenButton";
import FullscreenButton3States from "@AppBuilderLib/entities/viewport/ui/FullscreenButton3States";
import HistoryMenuButton from "@AppBuilderLib/entities/viewport/ui/HistoryMenuButton";
import RedoButton from "@AppBuilderLib/entities/viewport/ui/RedoButton";
import ReloadButton from "@AppBuilderLib/entities/viewport/ui/ReloadButton";
import UndoButton from "@AppBuilderLib/entities/viewport/ui/UndoButton";
import ZoomButton from "@AppBuilderLib/entities/viewport/ui/ZoomButton";
import ViewportComponent from "@AppBuilderLib/entities/viewport/ui/ViewportComponent";
import ViewportIcons from "@AppBuilderLib/entities/viewport/ui/ViewportIcons";
import ViewportOverlayWrapper from "@AppBuilderLib/entities/viewport/ui/ViewportOverlayWrapper";
import {IComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext.types";
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
		[ViewportIconButtonEnum.Fullscreen3States]: {
			component: FullscreenButton3States,
		},
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
