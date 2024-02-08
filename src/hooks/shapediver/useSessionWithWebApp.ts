import { SessionCreateDto } from "types/store/shapediverStoreViewer";
import { IShapeDiverExportDefinition } from "types/shapediver/export";
import { IShapeDiverParameterDefinition } from "types/shapediver/parameter";

/** Type used for parameter definitions */
type IWebAppParameterDefinition = IShapeDiverParameterDefinition;

/** Type used for export definitions */
type IWebAppExportDefinition = IShapeDiverExportDefinition;

/** Reference to a parameter (custom or defined by the session) */
interface IWebAppParameterRef {
	/** Optional id of the referenced parameter. Takes precedence over name. Id or name must be specified. */
	id?: string
	/** Optional name of the referenced parameter. Id takes precedence. Id or name must be specified. */
	name?: string
	/** Properties of the parameter to be overridden. */
	overrides?: Pick<IWebAppParameterDefinition, "displayname" | "group" | "order" | "tooltip" | "hidden">
	/** Disable the UI element of the parameter if its state is dirty. */
	disableIfDirty: boolean
	/** Ask the user to accept or reject changes of this parameter before executing them. */
	acceptRejectMode: boolean
}

/** Reference to an export (defined by the session) */
interface IWebAppExportRef {
	/** Optional id of the referenced export. Takes precedence over name. Id or name must be specified. */
	id?: string
	/** Optional name of the referenced export. Id takes precedence. Id or name must be specified. */
	name?: string
	/** Properties of the export to be overridden. */
	overrides?: Pick<IWebAppExportDefinition, "displayname" | "group" | "order" | "tooltip" | "hidden">
}

/** Types of widgets */
type WebAppWidgetType = "accordion" | "text" | "image";

/** 
 * Properties of a parameter and export accordion widget.
 * UI elements of the referenced parameters and exports are grouped 
 * and ordered according to their properties (which might be overridden).
 */
interface IWebAppWidgetPropsAccordion {
	/** References to parameters which shall be displayed by the accordion. */
	parameters: IWebAppParameterRef[]
	/** References to exports which shall be displayed by the accordion. */
	exports: IWebAppExportRef[]
	/** 
	 * Optional name of group that should be used for all parameters/exports without a group.
	 * In case this is not specified, parameters/exports without a group will be displayed without an accordion.
	 */
	defaultGroupName?: string
}

/** Properties of a text widget. */
interface IWebAppWidgetPropsText {
	/** Plain text. Takes precedence. */
	text?: string
	/** Optional markdown. */
	markdown?: string
}

/** Properties of an image widget. */
interface IWebAppWidgetPropsImage {
	/** Base 64 encoded image. Takes precedence over export reference. */
	data?: string
	/** Optional reference to export which provides the image */
	export?: IWebAppExportRef
}

/** A widget. */
interface IWebAppWidget {
	/** Type of the widget. */
	type: WebAppWidgetType
	/** Properties of the widget. */
	props: IWebAppWidgetPropsAccordion | IWebAppWidgetPropsText | IWebAppWidgetPropsImage
}

/** 
 * Types of icons for tabs 
 * @see https://tabler.io/icons
 */
type WebAppContainerTabIconType = "adjustments" | "adjustments-horizontal" | "arrow-back" | "arrow-down" | "arrow-forward" | "arrow-left" | "arrow-right" | "arrow-up" | "augmented-reality" | "augmented-reality-off" | "bookmark" | "bookmark-off" | "bookmarks" | "bookmarks-off" | "books" | "books-off" | "camera" | "camera-off" | "copy" | "dots" | "dots-vertical" | "download" | "download-off" | "file-download" | "file-export" | "file-import" | "key" | "key-off" | "link" | "link-off" | "maximize" | "maximize-off" | "network" | "network-off" | "photo" | "photo-off" | "refresh" | "refresh-off" | "reload" | "replace" | "settings" | "share" | "share-2" | "share-3" | "share-off" | "upload" | "user" | "user-off" | "users" | "video" | "video-off" | "world" | "world-off" | "zoom-scan";

/** 
 * A tab displayed in a container.
 */
interface IWebAppContainerTab {
	/** Name of the tab. */
	name: string
	/** Optional icon of the tab. */
	icon: WebAppContainerTabIconType
	/** Widgets displayed in the tab. */
	widgets: IWebAppWidget[]
}

/** Types of hints for containers */
type WebAppContainerHintType = "left" | "right" | "top" | "bottom";

/**
 * A container for UI elements
 */
interface IWebAppContainer {
	/** Hint on positioning of the container. */
	hint?: WebAppContainerHintType
	/** Tabs displayed in the container. */
	tabs?: IWebAppContainerTab[]
	/** Further widgets displayed in the container. */
	widgets?: IWebAppWidget[]
}

/**
 * Web app definition. 
 * This is the root of the custom UI definition.
 */
interface IWebApp {

	/** Version of the schema. */
	version: "1.0"

	/** 
	 * Optional list of custom parameters that can be referenced 
	 * in addition to parameters of the model.
	 */
	parameters?: IWebAppParameterDefinition[]

	/**
	 * Containers to be displayed.
	 */
	containers: IWebAppContainer[]
}


interface Props {
	/**
	 * Data of session to create.
	 */
	sessionDto: SessionCreateDto,
}

/** Prefix used to register custom parameters */
const CUSTOM_SESSION_ID_POSTFIX = "_webappui";

/** Name of data output used to
 *  define the custom UI behavior */
const CUSTOM_DATA_OUTPUT_NAME = "WebAppUi";

/** Name of input (parameter of the Grasshopper model) used to consume the custom parameter values */
const CUSTOM_DATA_INPUT_NAME = "WebAppUi";

/**
 * Hook for creating a session with a ShapeDiver model using the ShapeDiver 3D Viewer.
 * Registers all parameters and exports defined by the model as abstracted 
 * parameters and exports for use by the UI components. 
 * This hook also registers custom parameters and UI elements defined by a data output component 
 * of the model named "WebAppUi". 
 * Updates of the custom parameter values are fed back to the model as JSON into 
 * a text input named "WebAppUi".
 * 
 * @param props 
 * @returns 
 */
export function useSessionWithWebApp(props: Props) {
	// TODO

	// 

}
