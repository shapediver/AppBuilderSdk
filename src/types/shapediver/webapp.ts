import { IShapeDiverExportDefinition } from "types/shapediver/export";
import { IShapeDiverParameterDefinition } from "types/shapediver/parameter";
import { IconType } from "./icons";

/** Type used for parameter definitions */
export type IWebAppParameterDefinition = IShapeDiverParameterDefinition;

/** Type used for export definitions */
export type IWebAppExportDefinition = IShapeDiverExportDefinition;

/** Reference to a parameter (custom or defined by the session) */
export interface IWebAppParameterRef {
	/** Optional id of the referenced parameter. Takes precedence over name. Id or name must be specified. */
	id?: string
	/** Optional name of the referenced parameter. Id takes precedence. Id or name must be specified. */
	name?: string
	/** Properties of the parameter to be overridden. */
	overrides?: Pick<IWebAppParameterDefinition, "displayname" | "group" | "order" | "tooltip" | "hidden">
	/** Disable the UI element of the parameter if its state is dirty. */
	disableIfDirty?: boolean
	/** Ask the user to accept or reject changes of this parameter before executing them. */
	acceptRejectMode?: boolean
}

/** Reference to an export (defined by the session) */
export interface IWebAppExportRef {
	/** Optional id of the referenced export. Takes precedence over name. Id or name must be specified. */
	id?: string
	/** Optional name of the referenced export. Id takes precedence. Id or name must be specified. */
	name?: string
	/** Properties of the export to be overridden. */
	overrides?: Pick<IWebAppExportDefinition, "displayname" | "group" | "order" | "tooltip" | "hidden">
}

/** Types of widgets */
export type WebAppWidgetType = "accordion" | "text" | "image";

/** 
 * Properties of a parameter and export accordion widget.
 * UI elements of the referenced parameters and exports are grouped 
 * and ordered according to their properties (which might be overridden).
 */
export interface IWebAppWidgetPropsAccordion {
	/** References to parameters which shall be displayed by the accordion. */
	parameters?: IWebAppParameterRef[]
	/** References to exports which shall be displayed by the accordion. */
	exports?: IWebAppExportRef[]
	/** 
	 * Optional name of group that should be used for all parameters/exports without a group.
	 * In case this is not specified, parameters/exports without a group will be displayed without an accordion.
	 */
	defaultGroupName?: string
}

/** Properties of a text widget. */
export interface IWebAppWidgetPropsText {
	/** Plain text. Takes precedence. */
	text?: string
	/** Optional markdown. */
	markdown?: string
}

/** Properties of an image widget. */
export interface IWebAppWidgetPropsImage {
	/** URL to image. Can be a data URL including a base 64 encoded image. Takes precedence over export reference. */
	href?: string
	/** Optional reference to id or name of export which provides the image. */
	export?: string
}

/** A widget. */
export interface IWebAppWidget {
	/** Type of the widget. */
	type: WebAppWidgetType
	/** Properties of the widget. */
	props: IWebAppWidgetPropsAccordion | IWebAppWidgetPropsText | IWebAppWidgetPropsImage
}

/** 
 * A tab displayed in a container.
 */
export interface IWebAppTab {
	/** Name of the tab. */
	name: string
	/** Optional icon of the tab. */
	icon?: IconType
	/** Widgets displayed in the tab. */
	widgets: IWebAppWidget[]
}

/** Types of hints for containers */
export type WebAppContainerHintType = "left" | "right" | "top" | "bottom";

/**
 * A container for UI elements
 */
export interface IWebAppContainer {
	/** Hint on positioning of the container. */
	hint: WebAppContainerHintType
	/** Tabs displayed in the container. */
	tabs?: IWebAppTab[]
	/** Further widgets displayed in the container. */
	widgets?: IWebAppWidget[]
}

/**
 * Web app definition. 
 * This is the root of the custom UI definition.
 */
export interface IWebApp {

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

/** assert widget type "accordion" */
export function isAccordionWidget(widget: IWebAppWidget): widget is { type: "accordion", props: IWebAppWidgetPropsAccordion } {
	return widget.type === "accordion";
}

/** assert widget type "text" */
export function isTextWidget(widget: IWebAppWidget): widget is { type: "text", props: IWebAppWidgetPropsText } {
	return widget.type === "text";
}

/** assert widget type "image" */
export function isImageWidget(widget: IWebAppWidget): widget is { type: "image", props: IWebAppWidgetPropsImage } {
	return widget.type === "image";
}
