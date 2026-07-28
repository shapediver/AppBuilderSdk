import ParameterDraggingComponent from "@AppBuilderLib/entities/parameter/ui/ParameterDraggingComponent";
import ParameterDrawingComponent from "@AppBuilderLib/entities/parameter/ui/ParameterDrawingComponent";
import ParameterGumballComponent from "@AppBuilderLib/entities/parameter/ui/ParameterGumballComponent";
import ParameterRectangleTransformComponent from "@AppBuilderLib/entities/parameter/ui/ParameterRectangleTransformComponent";
import ParameterSelectionComponent from "@AppBuilderLib/entities/parameter/ui/ParameterSelectionComponent";
import ViewportAnchor2d, {
	ViewportAnchor2dThemeProps,
} from "@AppBuilderLib/entities/viewport-anchor/ui/ViewportAnchor2d";
import ViewportAnchor3d, {
	ViewportAnchor3dThemeProps,
} from "@AppBuilderLib/entities/viewport-anchor/ui/ViewportAnchor3d";
import ViewportComponent from "@AppBuilderLib/entities/viewport/ui/ViewportComponent";
import ViewportOverlayWrapper from "@AppBuilderLib/entities/viewport/ui/ViewportOverlayWrapper";
import {IComponentContext} from "@AppBuilderLib/features/appbuilder/config/ComponentContext.types";
import {
	AppBuilderContainerNameType,
	isArAction,
	isAttributeVisualizationWidget,
	isCameraAction,
	isFullscreenAction,
	isSceneTreeExplorerWidget,
} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import AppBuilderActionArComponent from "@AppBuilderLib/features/appbuilder/ui/AppBuilderActionArComponent";
import AppBuilderActionCameraComponent from "@AppBuilderLib/features/appbuilder/ui/AppBuilderActionCameraComponent";
import AppBuilderActionFullscreenComponent from "@AppBuilderLib/features/appbuilder/ui/AppBuilderActionFullscreenComponent";
import AppBuilderToolbarLayer from "@AppBuilderLib/features/appbuilder/ui/AppBuilderToolbarLayer";
import RootComponent from "@AppBuilderLib/shared/ui/root/RootComponent";
import AppBuilderAttributeVisualizationWidgetComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderAttributeVisualizationWidgetComponent";
import AppBuilderContainerComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderContainerComponent";
import AppBuilderFallbackContainerComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderFallbackContainerComponent";
import AppBuilderSceneTreeExplorerWidgetComponent from "@AppBuilderLib/widgets/appbuilder/ui/AppBuilderSceneTreeExplorerWidgetComponent";
import {NumberAttributeThemeProps} from "@AppBuilderLib/widgets/appbuilder/ui/attributes/NumberAttribute";
import {StringAttributeThemeProps} from "@AppBuilderLib/widgets/appbuilder/ui/attributes/StringAttribute";
import {PARAMETER_TYPE} from "@shapediver/viewer.session";
import "instruments/sentry";
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
	appBuilderToolbarLayer: {component: AppBuilderToolbarLayer},
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
			rectangleTransform: {
				component: ParameterRectangleTransformComponent,
				extraBottomPadding: true,
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
		ar: {
			isAction: isArAction,
			component: AppBuilderActionArComponent,
		},
		camera: {
			isAction: isCameraAction,
			component: AppBuilderActionCameraComponent,
		},
		fullscreen: {
			isAction: isFullscreenAction,
			component: AppBuilderActionFullscreenComponent,
		},
	},
	containerComponent: AppBuilderContainerComponent,
	fallbackContainerComponent: AppBuilderFallbackContainerComponent,
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
