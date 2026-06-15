import * as path from "path";
import {
	buildIntersectionDefinitionName,
	COMPACT_ICON_PROPS,
	createDefinitionsContext,
	DEFINITIONS_REF_PREFIX,
	ICON_THEME_DEFAULT_PROPS_CONFIG_PATH,
	postProcessDefinitions,
	postProcessFlatEntries,
	sanitizeDefinitionName,
	wrapDocFlatEntries,
} from "./typeDefinitions.ts";

const projectRoot = path.resolve(__dirname, "../..");

describe("createDefinitionsContext", () => {
	const getText = (arr: {text: string}[] | undefined) =>
		arr ? arr.map((s) => s.text).join("") : "";
	const processTagValue = (v: string) => v.trim();

	it("inlines primitive types without definitions", () => {
		const ctx = createDefinitionsContext({}, getText, processTagValue);
		const schema = ctx.resolveType({
			type: "intrinsic",
			name: "string",
		});
		expect(schema).toEqual({type: "string"});
		expect(Object.keys(ctx.definitions)).toHaveLength(0);
	});

	it("registers union types and returns $ref on properties", () => {
		const ctx = createDefinitionsContext({}, getText, processTagValue);
		const schema = ctx.resolveType({
			type: "union",
			name: "InteractionEffect",
			types: [
				{type: "intrinsic", name: "string"},
				{type: "intrinsic", name: "null"},
				{
					type: "reference",
					name: "IMaterialStandardDataPropertiesDefinition",
				},
			],
		});
		expect(schema).toEqual({
			$ref: `${DEFINITIONS_REF_PREFIX}InteractionEffect`,
		});
		expect(ctx.definitions.InteractionEffect).toEqual({
			oneOf: [
				{type: "string"},
				{type: "null"},
				{
					$ref: `${DEFINITIONS_REF_PREFIX}IMaterialStandardDataPropertiesDefinition`,
				},
			],
		});
	});

	it("registers object reflections with property schemas", () => {
		const ctx = createDefinitionsContext({}, getText, processTagValue);
		ctx.resolveType({
			type: "reflection",
			declaration: {
				children: [
					{
						name: "color",
						type: {type: "intrinsic", name: "string"},
						comment: {summary: [{text: "Fill color"}]},
					},
				],
			},
		});
		const keys = Object.keys(ctx.definitions);
		expect(keys).toHaveLength(1);
		const def = ctx.definitions[keys[0]];
		expect(def).toEqual({
			properties: {
				color: {type: "string", description: "Fill color"},
			},
		});
	});
});

describe("buildIntersectionDefinitionName", () => {
	it("includes Partial generic base, not bare Partial", () => {
		expect(
			buildIntersectionDefinitionName([
				{
					type: "reference",
					name: "ViewportOverlayWrapperProps",
					_target: {qualifiedName: "ViewportOverlayWrapperProps"},
				},
				{
					type: "reference",
					name: "Partial",
					typeArguments: [
						{
							type: "reference",
							name: "OverlayStyleProps",
							_target: {qualifiedName: "OverlayStyleProps"},
						},
					],
				},
			]),
		).toBe("ViewportOverlayWrapperProps_and_Partial_OverlayStyleProps");
	});
});

describe("sanitizeDefinitionName", () => {
	it("produces unique keys per Partial generic argument", () => {
		expect(sanitizeDefinitionName("Partial<ButtonProps>")).toBe(
			"Partial_ButtonProps",
		);
		expect(sanitizeDefinitionName("Partial<TooltipProps>")).toBe(
			"Partial_TooltipProps",
		);
		expect(sanitizeDefinitionName("Partial<ButtonProps>")).not.toBe(
			sanitizeDefinitionName("Partial<TooltipProps>"),
		);
	});
});

describe("Mantine mirror canonical refs", () => {
	const getText = (arr: {text: string}[] | undefined) =>
		arr ? arr.map((s) => s.text).join("") : "";
	const processTagValue = (v: string) => v.trim();

	it("resolves MantineButtonProps reference to ButtonProps $ref", () => {
		const ctx = createDefinitionsContext(
			{},
			getText,
			processTagValue,
			projectRoot,
		);
		const schema = ctx.resolveType({
			type: "reference",
			name: "MantineButtonProps",
		});
		expect(schema).toEqual({
			$ref: "#/definitions/ButtonProps",
		});
		expect(ctx.definitions.ButtonProps).toHaveProperty("properties");
	});

	it("redirects inline z.infer-shaped button props to ButtonProps $ref", () => {
		const ctx = createDefinitionsContext(
			{},
			getText,
			processTagValue,
			projectRoot,
		);
		const schema = ctx.resolveType({
			type: "reflection",
			declaration: {
				children: [
					{name: "fw", type: {type: "union", types: [{type: "intrinsic", name: "string"}, {type: "intrinsic", name: "number"}]}},
					{name: "mt", type: {type: "union", types: [{type: "intrinsic", name: "string"}, {type: "intrinsic", name: "number"}]}},
					{name: "ml", type: {type: "union", types: [{type: "intrinsic", name: "string"}, {type: "intrinsic", name: "number"}]}},
					{name: "px", type: {type: "union", types: [{type: "intrinsic", name: "string"}, {type: "intrinsic", name: "number"}]}},
					{name: "fz", type: {type: "union", types: [{type: "intrinsic", name: "string"}, {type: "intrinsic", name: "number"}]}},
					{name: "h", type: {type: "union", types: [{type: "intrinsic", name: "string"}, {type: "intrinsic", name: "number"}]}},
					{name: "variant", type: {type: "intrinsic", name: "string"}},
					{name: "size", type: {type: "intrinsic", name: "string"}},
					{name: "fullWidth", type: {type: "intrinsic", name: "boolean"}},
					{name: "justify", type: {type: "intrinsic", name: "string"}},
					{name: "disabled", type: {type: "intrinsic", name: "boolean"}},
					{
						name: "style",
						type: {
							type: "reflection",
							declaration: {
								indexSignature: {
									type: {
										type: "union",
										types: [
											{type: "intrinsic", name: "string"},
											{type: "intrinsic", name: "number"},
										],
									},
								},
							},
						},
					},
				],
			},
		});
		expect(schema).toEqual({
			$ref: "#/definitions/ButtonProps",
		});
		expect(
			ctx.definitions.fw_string_or_number_mt_string_or_number,
		).toBeUndefined();
	});
});

describe("Pick/Omit utility definitions with mirrors", () => {
	const getText = (arr: {text: string}[] | undefined) =>
		arr ? arr.map((s) => s.text).join("") : "";
	const processTagValue = (v: string) => v.trim();

	it("does not register Pick_ImageProps blob for Pick<ImageProps, radius | mah | maw>", () => {
		const ctx = createDefinitionsContext(
			{},
			getText,
			processTagValue,
			projectRoot,
		);

		ctx.resolveType({
			type: "reference",
			name: "Pick",
			typeArguments: [
				{
					type: "reference",
					name: "ImageProps",
					_target: {
						packageName: "@mantine/core",
						packagePath: "lib/components/Image/Image.d.ts",
						qualifiedName: "ImageProps",
					},
				},
				{
					type: "union",
					types: [
						{type: "literal", value: "radius"},
						{type: "literal", value: "mah"},
						{type: "literal", value: "maw"},
					],
				},
			],
		});

		expect(ctx.definitions.Pick_ImageProps).toBeUndefined();
		expect(ctx.definitions.ImageProps).toHaveProperty("properties");
		const imageProps = (
			ctx.definitions.ImageProps as {properties: Record<string, unknown>}
		).properties;
		expect(Object.keys(imageProps).sort()).toEqual([
			"fallbackSrc",
			"fit",
			"h",
			"mah",
			"maw",
			"radius",
			"w",
		]);
	});

	it("registers Omit<ImageProps, src | alt | onError> as ImageProps mirror", () => {
		const ctx = createDefinitionsContext(
			{},
			getText,
			processTagValue,
			projectRoot,
		);

		ctx.resolveType({
			type: "reference",
			name: "Omit",
			typeArguments: [
				{
					type: "reference",
					name: "ImageProps",
					_target: {
						packageName: "@mantine/core",
						packagePath: "lib/components/Image/Image.d.ts",
						qualifiedName: "ImageProps",
					},
				},
				{
					type: "union",
					types: [
						{type: "literal", value: "src"},
						{type: "literal", value: "alt"},
						{type: "literal", value: "onError"},
					],
				},
			],
		});

		expect(ctx.definitions.Omit_ImageProps).toBeUndefined();
		expect(ctx.definitions.ImageProps).toHaveProperty("properties");
		const imageProps = (
			ctx.definitions.ImageProps as {properties: Record<string, unknown>}
		).properties;
		expect(Object.keys(imageProps).sort()).toEqual([
			"fallbackSrc",
			"fit",
			"h",
			"mah",
			"maw",
			"radius",
			"w",
		]);
	});
});

describe("Partial utility definitions", () => {
	const getText = (arr: {text: string}[] | undefined) =>
		arr ? arr.map((s) => s.text).join("") : "";
	const processTagValue = (v: string) => v.trim();
	it("registers separate definition keys for Partial<ButtonProps> and Partial<TextProps>", () => {
		const ctx = createDefinitionsContext(
			{},
			getText,
			processTagValue,
			projectRoot,
		);

		ctx.resolveType({
			type: "reference",
			name: "Partial",
			typeArguments: [
				{
					type: "reference",
					name: "ButtonProps",
					_target: {
						packageName: "@mantine/core",
						packagePath: "lib/components/Button/Button.d.ts",
						qualifiedName: "ButtonProps",
					},
				},
			],
		});
		ctx.resolveType({
			type: "reference",
			name: "Partial",
			typeArguments: [
				{
					type: "reference",
					name: "TextProps",
					_target: {
						packageName: "@mantine/core",
						packagePath: "lib/components/Text/Text.d.ts",
						qualifiedName: "TextProps",
					},
				},
			],
		});

		expect(ctx.definitions.Partial).toBeUndefined();
		expect(ctx.definitions.Partial_ButtonProps).toBeUndefined();
		expect(ctx.definitions.ButtonProps).toHaveProperty("properties");
		expect(
			(ctx.definitions.ButtonProps as {properties: Record<string, unknown>})
				.properties,
		).toHaveProperty("variant");
		expect(ctx.definitions.Partial_TextProps).toBeUndefined();
		expect(ctx.definitions.TextProps).toHaveProperty("properties");
		expect(
			(ctx.definitions.TextProps as {properties: Record<string, unknown>})
				.properties,
		).toHaveProperty("fw");
		expect(ctx.definitions.ButtonProps).not.toEqual(
			ctx.definitions.TextProps,
		);
	});
});

describe("ViewportIconButton Partial props", () => {
	const getText = (arr: {text: string}[] | undefined) =>
		arr ? arr.map((s) => s.text).join("") : "";
	const processTagValue = (v: string) => v.trim();

	it("resolves tooltipWrapperProps to TooltipProps, not iconProps", () => {
		const ctx = createDefinitionsContext(
			{},
			getText,
			processTagValue,
			projectRoot,
		);
		ctx.setEntrySourceFile(
			"src/shared/entities/viewport/ui/ViewportIconButton.tsx",
		);

		const tooltipSchema = ctx.resolveType(
			{
				type: "reference",
				name: "Partial",
				typeArguments: [
					{
						type: "reference",
						name: "TooltipProps",
						_target: {
							packageName: "@mantine/core",
							packagePath:
								"lib/components/Tooltip/Tooltip.d.ts",
							qualifiedName: "TooltipProps",
						},
					},
				],
			},
			"tooltipWrapperProps",
		);

		expect(tooltipSchema).toEqual({
			$ref: `${DEFINITIONS_REF_PREFIX}TooltipProps`,
		});
		expect(tooltipSchema).not.toEqual({
			$ref: `${DEFINITIONS_REF_PREFIX}ViewportIconButton_iconProps`,
		});
	});

	it("resolves iconProps Partial<IconProps> to compact icon schema", () => {
		const ctx = createDefinitionsContext(
			{},
			getText,
			processTagValue,
			projectRoot,
		);
		ctx.setEntrySourceFile(
			"src/shared/entities/viewport/ui/ViewportIconButton.tsx",
		);

		const iconSchema = ctx.resolveType(
			{
				type: "reference",
				name: "Partial",
				typeArguments: [{type: "reference", name: "IconProps"}],
			},
			"iconProps",
		);

		expect(iconSchema).toEqual({
			$ref: `${DEFINITIONS_REF_PREFIX}Partial_IconProps`,
		});
	});
});

describe("Icon theme doc entry", () => {
	it("postProcessFlatEntries aligns empty-extends PaperProps inline to mirror", () => {
		const projectRoot = path.resolve(__dirname, "../..");
		const entries = [
			{
				configPath:
					"themeOverrides.components.AppBuilderTextWidgetComponent.defaultProps",
				name: "AppBuilderTextWidgetComponent",
				summary: "",
				source: "AppBuilderTextWidgetComponent.tsx",
				properties: [
					{name: "withBorder", description: "", type: {type: "boolean"}},
					{name: "shadow", description: "", type: {type: "string"}},
					{
						name: "p",
						description: "",
						type: {$ref: `${DEFINITIONS_REF_PREFIX}string_or_number`},
					},
					{
						name: "px",
						description: "",
						type: {$ref: `${DEFINITIONS_REF_PREFIX}string_or_number`},
					},
					{
						name: "py",
						description: "",
						type: {$ref: `${DEFINITIONS_REF_PREFIX}string_or_number`},
					},
					{
						name: "style",
						description: "",
						type: {
							$ref: `${DEFINITIONS_REF_PREFIX}MantineCssStyleRecord`,
						},
					},
					{
						name: "styles",
						description: "",
						type: {
							$ref: `${DEFINITIONS_REF_PREFIX}MantineStylesApi`,
						},
					},
				],
			},
		];
		const definitions = {
			PaperProps: {
				properties: {
					withBorder: {type: "boolean"},
					shadow: {type: "string"},
					p: {$ref: `${DEFINITIONS_REF_PREFIX}MantineSpacing`},
					px: {$ref: `${DEFINITIONS_REF_PREFIX}MantineSpacing`},
					py: {$ref: `${DEFINITIONS_REF_PREFIX}MantineSpacing`},
					style: {
						$ref: `${DEFINITIONS_REF_PREFIX}MantineCssStyleRecord`,
					},
					styles: {
						$ref: `${DEFINITIONS_REF_PREFIX}MantineStylesApi`,
					},
				},
			},
		};
		postProcessFlatEntries(entries, definitions, projectRoot);
		expect(entries[0].properties).toEqual([
			{name: "withBorder", description: "", type: {type: "boolean"}},
			{name: "shadow", description: "", type: {type: "string"}},
			{
				name: "p",
				description: "",
				type: {$ref: `${DEFINITIONS_REF_PREFIX}MantineSpacing`},
			},
			{
				name: "px",
				description: "",
				type: {$ref: `${DEFINITIONS_REF_PREFIX}MantineSpacing`},
			},
			{
				name: "py",
				description: "",
				type: {$ref: `${DEFINITIONS_REF_PREFIX}MantineSpacing`},
			},
			{
				name: "style",
				description: "",
				type: {
					$ref: `${DEFINITIONS_REF_PREFIX}MantineCssStyleRecord`,
				},
			},
			{
				name: "styles",
				description: "",
				type: {
					$ref: `${DEFINITIONS_REF_PREFIX}MantineStylesApi`,
				},
			},
		]);
	});

	it("postProcessFlatEntries replaces Iconify pollution with mirror props", () => {
		const entries = [
			{
				configPath: ICON_THEME_DEFAULT_PROPS_CONFIG_PATH,
				name: "Icon",
				summary: "",
				source: "src/shared/shared/ui/icon/Icon.types.ts",
				properties: [
					{name: "id", description: "", type: {type: "string"}},
					{name: "onLoad", description: "", type: {type: "unknown", name: "Function"}},
				],
			},
		];
		const definitions = {IconProps: COMPACT_ICON_PROPS};
		postProcessFlatEntries(entries, definitions);
		expect(entries[0].properties?.map((prop) => prop.name).sort()).toEqual([
			"color",
			"colorDisabled",
			"iconType",
			"size",
			"stroke",
		]);
	});

	it("postProcessDefinitions compacts Partial_IconProps to mirror surface", () => {
		const definitions = {
			Partial_IconProps: {
				properties: {
					id: {type: "string"},
					onLoad: {type: "unknown", name: "Function"},
				},
			},
		};
		postProcessDefinitions(definitions);
		expect(definitions.Partial_IconProps).toEqual(COMPACT_ICON_PROPS);
	});
});

describe("Record utility definitions", () => {
	const getText = (arr: {text: string}[] | undefined) =>
		arr ? arr.map((s) => s.text).join("") : "";
	const processTagValue = (v: string) => v.trim();

	it("resolves Record<string, string | number> as MantineCssStyleRecord ref", () => {
		const ctx = createDefinitionsContext(
			{},
			getText,
			processTagValue,
			projectRoot,
		);
		const schema = ctx.resolveType({
			type: "reference",
			name: "Record",
			typeArguments: [
				{type: "intrinsic", name: "string"},
				{
					type: "union",
					types: [
						{type: "intrinsic", name: "string"},
						{type: "intrinsic", name: "number"},
					],
				},
			],
		});
		expect(schema).toEqual({
			$ref: "#/definitions/MantineCssStyleRecord",
		});
		expect(ctx.definitions.Record_string).toBeUndefined();
	});

	it("resolves ParameterSelectComponent componentSettings map", () => {
		const ctx = createDefinitionsContext(
			{},
			getText,
			processTagValue,
			projectRoot,
		);
		ctx.setEntrySourceFile(
			"src/shared/entities/parameter/ui/ParameterSelectComponent.tsx",
		);
		const schema = ctx.resolveType({
			type: "reference",
			name: "Record",
			typeArguments: [
				{type: "intrinsic", name: "string"},
				{
					type: "reference",
					name: "ISelectComponentOverrides",
				},
			],
		});
		expect(schema).toEqual({
			$ref: "#/definitions/Record_string_ISelectComponentOverrides",
		});
		const def = ctx.definitions.Record_string_ISelectComponentOverrides;
		expect(def).toHaveProperty("properties");
		const value = (
			def as {properties: Record<string, {properties?: Record<string, unknown>}>}
		).properties["[string]"];
		expect(value?.properties).toEqual({
			type: {
				type: "unknown",
				name: "SelectComponentType",
				description: "Type of select component to use.",
			},
			itemData: {
				type: "unknown",
				name: "Record<string, ISelectComponentItemDataType>",
				description:
					"Record containing optional further item data per item name.",
			},
			settings: {
				type: "unknown",
				name: "SelectComponentSettings",
				description: "Optional further settings, like image width etc.",
			},
		});
		expect(JSON.stringify(def).length).toBeLessThan(800);
	});
});

describe("postProcessDefinitions", () => {
	it("drops EventHandler definitions and compacts ViewportOverlay intersection", () => {
		const definitions = {
			ClipboardEventHandler_SVGSVGElement: {
				type: "unknown" as const,
				name: "ClipboardEventHandler<SVGSVGElement>",
			},
			ViewportOverlayWrapperProps_and_Partial_OverlayStyleProps: {
				properties: {
					children: {
						oneOf: [
							{type: "string" as const},
							{
								properties: {
									type: {type: "string" as const},
									props: {type: "unknown" as const, name: "any"},
									key: {type: "string" as const},
									children: {type: "unknown" as const, name: "ReactNode"},
								},
							},
						],
					},
					position: {
						type: "unknown" as const,
						name: "ResponsiveValueType<OverlayPositionType>",
					},
					offset: {type: "string" as const},
				},
			},
		};
		postProcessDefinitions(definitions);
		expect(definitions.ClipboardEventHandler_SVGSVGElement).toBeUndefined();
		expect(
			definitions.ViewportOverlayWrapperProps_and_Partial_OverlayStyleProps,
		).toEqual({
			properties: {
				children: {type: "unknown", name: "ReactNode"},
				position: {
					type: "unknown",
					name: "ResponsiveValueType<OverlayPositionType>",
				},
				offset: {type: "string"},
				offsetX: {type: "string"},
				offsetY: {type: "string"},
				className: {type: "string"},
			},
		});
	});

	it("compacts Record_string_ISelectComponentOverrides and rewrites responsive duplicates", () => {
		const definitions = {
			Record_string_ISelectComponentOverrides: {
				properties: {
					"[string]": {
						properties: {
							type: {type: "unknown" as const, name: "SelectComponentType"},
							settings: {
								properties: {
									carouselProps: {type: "unknown" as const, name: "Huge"},
								},
							},
						},
					},
				},
			},
			MantineResponsiveCssSize: {
				oneOf: [{type: "string" as const}, {type: "number" as const}],
			},
			base_string_or_number_xs_string_or_number_sm_string_or_number: {
				properties: {
					base: {oneOf: [{type: "string" as const}, {type: "number" as const}]},
					xs: {oneOf: [{type: "string" as const}, {type: "number" as const}]},
					sm: {oneOf: [{type: "string" as const}, {type: "number" as const}]},
				},
			},
			ViewportBranding: {
				properties: {
					logo: {type: "string" as const},
				},
			},
			logo_string_or_null_backgroundColor_string: {
				properties: {
					logo: {type: "string" as const},
					backgroundColor: {type: "string" as const},
					busyModeSpinner: {type: "string" as const},
					busyModeDisplay: {type: "unknown" as const, name: "BUSY_MODE_DISPLAY"},
					spinnerPositioning: {
						type: "unknown" as const,
						name: "SPINNER_POSITIONING",
					},
				},
			},
			SomeEntry: {
				properties: {
					size: {
						$ref: "#/definitions/base_string_or_number_xs_string_or_number_sm_string_or_number",
					},
					branding: {
						$ref: "#/definitions/logo_string_or_null_backgroundColor_string",
					},
				},
			},
		};
		postProcessDefinitions(definitions);
		expect(
			definitions.Record_string_ISelectComponentOverrides,
		).toEqual({
			properties: {
				"[string]": {
					properties: {
						type: {
							type: "unknown",
							name: "SelectComponentType",
							description: "Type of select component to use.",
						},
						itemData: {
							type: "unknown",
							name: "Record<string, ISelectComponentItemDataType>",
							description:
								"Record containing optional further item data per item name.",
						},
						settings: {
							type: "unknown",
							name: "SelectComponentSettings",
							description:
								"Optional further settings, like image width etc.",
						},
					},
				},
			},
		});
		expect(
			definitions.base_string_or_number_xs_string_or_number_sm_string_or_number,
		).toBeUndefined();
		expect(
			(definitions.SomeEntry as {properties: {size: {$ref: string}}})
				.properties.size.$ref,
		).toBe(`${DEFINITIONS_REF_PREFIX}MantineResponsiveCssSize`);
		expect(
			definitions.logo_string_or_null_backgroundColor_string,
		).toBeUndefined();
		expect(
			(definitions.SomeEntry as {properties: {branding: {$ref: string}}})
				.properties.branding.$ref,
		).toBe(`${DEFINITIONS_REF_PREFIX}ViewportBranding`);
	});

	it("canonicalizes MantineResponsiveCssSize unions without sanitized keys", () => {
		const getText = (arr: {text: string}[] | undefined) =>
			arr ? arr.map((s) => s.text).join("") : "";
		const processTagValue = (v: string) => v.trim();
		const ctx = createDefinitionsContext(
			{},
			getText,
			processTagValue,
			projectRoot,
		);
		const schema = ctx.resolveType({
			type: "union",
			types: [
				{type: "intrinsic", name: "string"},
				{type: "intrinsic", name: "number"},
				{
					type: "reflection",
					declaration: {
						children: [
							{
								name: "base",
								type: {
									type: "union",
									types: [
										{type: "intrinsic", name: "string"},
										{type: "intrinsic", name: "number"},
									],
								},
							},
							{
								name: "xs",
								type: {
									type: "union",
									types: [
										{type: "intrinsic", name: "string"},
										{type: "intrinsic", name: "number"},
									],
								},
							},
							{
								name: "sm",
								type: {
									type: "union",
									types: [
										{type: "intrinsic", name: "string"},
										{type: "intrinsic", name: "number"},
									],
								},
							},
						],
					},
				},
			],
		});
		expect(schema).toEqual({
			$ref: `${DEFINITIONS_REF_PREFIX}MantineResponsiveCssSize`,
		});
		expect(
			Object.keys(ctx.definitions).some((key) =>
				key.includes("base_string_or_number"),
			),
		).toBe(false);
	});

	it("inlines EventHandler types without registering definitions", () => {
		const ctx = createDefinitionsContext(
			{},
			(arr: {text: string}[] | undefined) =>
				arr ? arr.map((s) => s.text).join("") : "",
			(v: string) => v.trim(),
		);
		const schema = ctx.resolveType({
			type: "reference",
			name: "ClipboardEventHandler<SVGSVGElement>",
		});
		expect(schema).toEqual({type: "unknown", name: "Function"});
		expect(
			Object.keys(ctx.definitions).some((k) => k.includes("EventHandler")),
		).toBe(false);
	});
});

describe("wrapDocFlatEntries", () => {
	it("wraps entries with definitions object", () => {
		const doc = wrapDocFlatEntries(
			[{configPath: "a.b", name: "A", summary: "", source: "x.ts"}],
			{Foo: {type: "string"}},
		);
		expect(doc.entries).toHaveLength(1);
		expect(doc.definitions.Foo).toEqual({type: "string"});
		expect(doc.entriesByCategory).toEqual({});
	});

	it("builds entriesByCategory index from entry.category", () => {
		const doc = wrapDocFlatEntries(
			[
				{
					configPath: "themeOverrides.components.A.defaultProps",
					name: "A",
					category: "widget",
				},
				{
					configPath: "themeOverrides.components.B.defaultProps",
					name: "B",
					category: "entity",
				},
				{
					configPath: "themeOverrides.components.C.defaultProps",
					name: "C",
					category: "widget",
				},
			],
			{},
		);
		expect(doc.entriesByCategory).toEqual({
			widget: [
				"themeOverrides.components.A.defaultProps",
				"themeOverrides.components.C.defaultProps",
			],
			entity: ["themeOverrides.components.B.defaultProps"],
		});
	});
});
