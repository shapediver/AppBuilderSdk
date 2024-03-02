import { IShapeDiverExportDefinition } from "types/shapediver/export";
import { IShapeDiverParameterDefinition } from "types/shapediver/parameter";
import { IconType } from "./icons";
import { SessionCreateDto } from "types/store/shapediverStoreViewer";

/** Type used for parameter definitions */
export type IAppBuilderParameterDefinition = IShapeDiverParameterDefinition;

/** Type used for export definitions */
export type IAppBuilderExportDefinition = IShapeDiverExportDefinition;

/** Reference to a parameter (custom or defined by the session) */
export interface IAppBuilderParameterRef {
	/** Id or name or displayname of the referenced parameter (in that order). */
	name: string
	/** Optional id of the session the referenced parameter belongs to. */
	sessionId?: string
	/** Properties of the parameter to be overridden. TODO implement this */
	overrides?: Pick<IAppBuilderParameterDefinition, "displayname" | "group" | "order" | "tooltip" | "hidden">
	/** Disable the UI element of the parameter if its state is dirty. */
	disableIfDirty?: boolean
	/** Ask the user to accept or reject changes of this parameter before executing them. */
	acceptRejectMode?: boolean
}

/** Reference to an export (defined by the session) */
export interface IAppBuilderExportRef {
	/** Id or name or displayname of the referenced export (in that order). */
	name: string
	/** Optional id of the session the referenced parameter belongs to. */
	sessionId?: string
	/** Properties of the export to be overridden. TODO implement this */
	overrides?: Pick<IAppBuilderExportDefinition, "displayname" | "group" | "order" | "tooltip" | "hidden">
}

/** Types of widgets */
export type AppBuilderWidgetType = "accordion" | "text" | "image";

/** Common properties of widgets. */
export interface IAppBuilderWidgetPropsCommon {
	/** Type of the container that contains the widget. */
	containerType?: AppBuilderContainerTypeEnum
}

/** 
 * Properties of a parameter and export accordion widget.
 * UI elements of the referenced parameters and exports are grouped 
 * and ordered according to their properties (which might be overridden).
 */
export interface IAppBuilderWidgetPropsAccordion extends IAppBuilderWidgetPropsCommon {
	/** References to parameters which shall be displayed by the accordion. */
	parameters?: IAppBuilderParameterRef[]
	/** References to exports which shall be displayed by the accordion. */
	exports?: IAppBuilderExportRef[]
	/** 
	 * Optional name of group that should be used for all parameters/exports without a group.
	 * In case this is not specified, parameters/exports without a group will be displayed without an accordion.
	 */
	defaultGroupName?: string
}

/** Properties of a text widget. */
export interface IAppBuilderWidgetPropsText extends IAppBuilderWidgetPropsCommon {
	/** Plain text. Takes precedence. */
	text?: string
	/** Optional markdown. */
	markdown?: string
}

/** Properties of an image widget. */
export interface IAppBuilderWidgetPropsImage extends IAppBuilderWidgetPropsCommon {
	/** URL to image. Can be a data URL including a base 64 encoded image. Takes precedence over export reference. */
	href?: string
	/** Optional reference to export which provides the image. */
	export?: IAppBuilderExportRef
}

/** A widget. */
export interface IAppBuilderWidget {
	/** Type of the widget. */
	type: AppBuilderWidgetType
	/** Properties of the widget. */
	props: IAppBuilderWidgetPropsAccordion | IAppBuilderWidgetPropsText | IAppBuilderWidgetPropsImage
}

/** 
 * A tab displayed in a container.
 */
export interface IAppBuilderTab extends IAppBuilderWidgetPropsCommon {
	/** Name of the tab. */
	name: string
	/** Optional icon of the tab. */
	icon?: IconType
	/** Widgets displayed in the tab. */
	widgets: IAppBuilderWidget[]
}

/** Types of hints for containers */
export type AppBuilderContainerNameType = "left" | "right" | "top" | "bottom";

/**
 * A container for UI elements
 */
export interface IAppBuilderContainer extends IAppBuilderWidgetPropsCommon {
	/** Name of the container. */
	name: AppBuilderContainerNameType
	/** Tabs displayed in the container. */
	tabs?: IAppBuilderTab[]
	/** Further widgets displayed in the container. */
	widgets?: IAppBuilderWidget[]
}

/** Types of container direction */
export enum AppBuilderContainerTypeEnum {
	Row = "row",
	Column = "column"
}

/**
 * Web app definition. 
 * This is the root of the custom UI definition.
 */
export interface IAppBuilder {

	/** Version of the schema. */
	version: "1.0"

	/** 
	 * Optional list of custom parameters that can be referenced 
	 * in addition to parameters of the model.
	 */
	parameters?: IAppBuilderParameterDefinition[]

	/** Optional id of the session to use for defining custom parameters. */
	sessionId?: string
	
	/**
	 * Containers to be displayed.
	 */
	containers: IAppBuilderContainer[]
}

/** assert widget type "accordion" */
export function isAccordionWidget(widget: IAppBuilderWidget): widget is { type: "accordion", props: IAppBuilderWidgetPropsAccordion } {
	return widget.type === "accordion";
}

/** assert widget type "text" */
export function isTextWidget(widget: IAppBuilderWidget): widget is { type: "text", props: IAppBuilderWidgetPropsText } {
	return widget.type === "text";
}

/** assert widget type "image" */
export function isImageWidget(widget: IAppBuilderWidget): widget is { type: "image", props: IAppBuilderWidgetPropsImage } {
	return widget.type === "image";
}

/**
 * Settings for a session used by the AppBuilder.
 */
export interface IIAppBuilderSettingsSession extends SessionCreateDto {
	/**
	 * Either slug and platformUrl, or ticket and modelViewUrl must be set.
	 */
	slug?: string,
	/**
	 * Either slug and platformUrl, or ticket and modelViewUrl must be set.
	 */
	platformUrl?: string,
	/**
	 * Set to true to require confirmation of the user to accept or reject changed parameter values.
	 */
	acceptRejectMode?: boolean
}

/**
 * Settings for initializing an AppBuilder application. This defines the sessions to create.
 */
export interface IAppBuilderSettings {
    "version": "1.0",
	/** Session to load. */
    "sessions": IIAppBuilderSettingsSession[]
}