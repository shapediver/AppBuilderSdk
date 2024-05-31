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
	/** Properties of the parameter to be overridden. */
	overrides?: Pick<Partial<IAppBuilderParameterDefinition>, "displayname" | "group" | "order" | "tooltip" | "hidden">
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
	/** Properties of the export to be overridden. */
	overrides?: Pick<Partial<IAppBuilderExportDefinition>, "displayname" | "group" | "order" | "tooltip" | "hidden">
}

/** Types of widgets */
export type AppBuilderWidgetType = "accordion" | "text" | "image";

/** 
 * Properties of a parameter and export accordion widget.
 * UI elements of the referenced parameters and exports are grouped 
 * and ordered according to their properties (which might be overridden).
 */
export interface IAppBuilderWidgetPropsAccordion {
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
export interface IAppBuilderWidgetPropsText {
	/** Plain text. Takes precedence. */
	text?: string
	/** Optional markdown. */
	markdown?: string
}

export interface IAppBuilderWidgetPropsAnchor {
	/** Follow link. */
	anchor?: string,
	/** Optional reference to specifies where to open the linked document which provides the image, "_blank" by default */
	target?: string,
}

/** Properties of an image widget. */
export interface IAppBuilderWidgetPropsImage extends IAppBuilderWidgetPropsAnchor {
	/** Optional reference to alternate text which provides the image. */
	alt?: string,
	/** Optional reference to export which provides the image. */
	export?: IAppBuilderExportRef
	/** URL to image. Can be a data URL including a base 64 encoded image. Takes precedence over export reference. */
	href?: string
}

/** 
 * A widget.
 * 
 * When implementing a new widget type, extend this interface and 
 * 
 *   * add the identifier for the new type to AppBuilderWidgetType, and
 *   * define a new interface for the properties of the widget type and 
 *     add it to the union type of "props".
 */
export interface IAppBuilderWidget {
	/** Type of the widget. */
	type: AppBuilderWidgetType
	/** Properties of the widget. Add properties of  */
	props: IAppBuilderWidgetPropsAccordion | IAppBuilderWidgetPropsText | IAppBuilderWidgetPropsImage
}

/** 
 * A tab displayed in a container.
 */
export interface IAppBuilderTab {
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
export interface IAppBuilderContainer {
	/** Name of the container. */
	name: AppBuilderContainerNameType
	/** Tabs displayed in the container. */
	tabs?: IAppBuilderTab[]
	/** Further widgets displayed in the container. */
	widgets?: IAppBuilderWidget[]
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
export interface IAppBuilderSettingsSession extends SessionCreateDto {
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
 * AppBuilder-related settings.
 */
export interface IAppBuilderSettingsSettings {
	/**
	 * If true, hide the fallback AppBuilder containers which 
	 * are shown in case no AppBuilder data output is found.
	 */
	disableFallbackUi?: boolean,
}

/**
 * Platform authorization.
 */
export interface IAppBuilderSettingsAuthorization {
	/** Access token for the ShapeDiver platform. */
	jwtToken?: string
	/** Platform base URL */
	platformUrl: string
}

/**
 * Settings for initializing an AppBuilder application from a JSON file. This defines the sessions to create.
 */
export interface IAppBuilderSettingsJson {
	version: "1.0",
	/** Session to load. */
    sessions?: IAppBuilderSettingsSession[]
	/** Settings */
	settings?: IAppBuilderSettingsSettings
	/** Authorization for the ShapeDiver platform */
	auth?: IAppBuilderSettingsAuthorization,
	/** 
	 * Theme overrides
	 * @see https://mantine.dev/theming/theme-object/
	 */
	themeOverrides?: Record<string, any>,
	/**
	 * Optional AppBuilder definition, to be used instead of the 
	 * AppBuilder output of the ShapeDiver model. This is useful
	 * for development. 
	 */
	appBuilderOverride?: IAppBuilder
}

/**
 * Settings for initializing an AppBuilder application. This defines the sessions to create.
 */
export interface IAppBuilderSettings extends IAppBuilderSettingsJson {
	/** Session to load. */
    sessions: IAppBuilderSettingsSession[]
}