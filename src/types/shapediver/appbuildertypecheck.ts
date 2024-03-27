import { ShapeDiverResponseParameterStructure, ShapeDiverResponseParameterType, ShapeDiverResponseParameterVisualization } from "@shapediver/api.geometry-api-dto-v2";
import { z } from "zod";
import { IconTypeEnum } from "./icons";
import { AppBuilderContainerTypeEnum } from "./appbuilder";

// Zod type definition for IAppBuilderParameterDefinition
const IAppBuilderParameterDefinitionSchema = z.object({
	id: z.string(),
	choices: z.array(z.string()).optional(),
	decimalplaces: z.number().optional(),
	defval: z.string(),
	expression: z.string().optional(),
	format: z.array(z.string()).optional(),
	min: z.number().optional(),
	max: z.number().optional(),
	umin: z.number().optional(),
	umax: z.number().optional(),
	vmin: z.number().optional(),
	vmax: z.number().optional(),
	interval: z.number().optional(),
	name: z.string(),
	type: z.nativeEnum(ShapeDiverResponseParameterType),
	visualization: z.nativeEnum(ShapeDiverResponseParameterVisualization).optional(),
	structure: z.nativeEnum(ShapeDiverResponseParameterStructure).optional(),
	group: z.object({
		id: z.string(),
		name: z.string(),
	}).optional(),
	hint: z.string().optional(),
	order: z.number().optional(),
	tooltip: z.string().optional(),
	displayname: z.string().optional(),
	hidden: z.boolean(),
});

// Zod type definition for IAppBuilderParameterRef
const IAppBuilderParameterRefSchema = z.object({
	name: z.string(),
	sessionId: z.string().optional(),
	disableIfDirty: z.boolean().optional(),
	acceptRejectMode: z.boolean().optional(),
});

// Zod type definition for IAppBuilderExportRef
const IAppBuilderExportRefSchema = z.object({
	name: z.string(),
	sessionId: z.string().optional(),
});

// Zod type definition for IAppBuilderWidgetPropsCommon
const IAppBuilderWidgetPropsCommonSchema = z.object({
	containerType: z.nativeEnum(AppBuilderContainerTypeEnum).optional(),
});

// Zod type definition for IAppBuilderWidgetPropsAccordion
const IAppBuilderWidgetPropsAccordionSchema = z.object({
	parameters: z.array(IAppBuilderParameterRefSchema).optional(),
	exports: z.array(IAppBuilderExportRefSchema).optional(),
	defaultGroupName: z.string().optional(),
}).extend(IAppBuilderWidgetPropsCommonSchema.shape);

// Zod type definition for IAppBuilderWidgetPropsText
const IAppBuilderWidgetPropsTextSchema = z.object({
	text: z.string().optional(),
	markdown: z.string().optional(),
}).extend(IAppBuilderWidgetPropsCommonSchema.shape);

// Zod type definition for IAppBuilderWidgetPropsImage
const IAppBuilderWidgetPropsImageSchema = z.object({
	href: z.string().optional(),
	export: IAppBuilderExportRefSchema.optional(),
}).extend(IAppBuilderWidgetPropsCommonSchema.shape);

// Zod type definition for IAppBuilderWidget
const IAppBuilderWidgetSchema = z.discriminatedUnion("type", [
	z.object({type: z.literal("accordion"), props: IAppBuilderWidgetPropsAccordionSchema}),
	z.object({type: z.literal("text"), props: IAppBuilderWidgetPropsTextSchema}),
	z.object({type: z.literal("image"), props: IAppBuilderWidgetPropsImageSchema}),
]);

// Zod type definition for IAppBuilderTab
const IAppBuilderTabSchema = z.object({
	name: z.string(),
	icon: z.nativeEnum(IconTypeEnum).optional(),
	widgets: z.array(IAppBuilderWidgetSchema),
}).extend(IAppBuilderWidgetPropsCommonSchema.shape);

// Zod type definition for IAppBuilderContainer
const IAppBuilderContainerSchema = z.object({
	name: z.enum(["left", "right", "top", "bottom"]),
	tabs: z.array(IAppBuilderTabSchema).optional(),
	widgets: z.array(IAppBuilderWidgetSchema).optional(),
}).extend(IAppBuilderWidgetPropsCommonSchema.shape);

// Zod type definition for IAppBuilder
const IAppBuilderSchema = z.object({
	version: z.literal("1.0"),
	parameters: z.array(IAppBuilderParameterDefinitionSchema).optional(),
	sessionId: z.string().optional(),
	containers: z.array(IAppBuilderContainerSchema),
});

export const validateAppBuilder = (value: any) => {
	return IAppBuilderSchema.safeParse(value);
};

// Zod type definition for IAppBuilderSettingsSession
const IAppBuilderSettingsSessionSchema = z.object({
	ticket: z.string().optional(),
	guid: z.string().optional(),
	modelViewUrl: z.string(),
	jwtToken: z.string().optional(),
	id: z.string(),
	waitForOutputs: z.boolean().optional(),
	loadOutputs: z.boolean().optional(),
	excludeViewports: z.array(z.string()).optional(),
	initialParameterValues: z.record(z.string()).optional(),
	slug: z.string().optional(),
	platformUrl: z.string().optional(),
	acceptRejectMode: z.boolean().optional(),
});

// Zod type definition for IAppBuilderSettingsSettings
const IAppBuilderSettingsSettingsSchema = z.object({
	disableFallbackUi: z.boolean().optional(),
});

// Zod type definition for IAppBuilderSettings
const IAppBuilderSettingsSchema = z.object({
	version: z.literal("1.0"),
	sessions: z.array(IAppBuilderSettingsSessionSchema),
	settings: IAppBuilderSettingsSettingsSchema.optional(),
	themeOverrides: z.record(z.string(), z.any()).optional(),
});

export const validateAppBuilderSettings = (value: any) => {
	return IAppBuilderSettingsSchema.safeParse(value);
};
