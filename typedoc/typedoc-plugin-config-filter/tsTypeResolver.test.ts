import * as fs from "fs";
import * as path from "path";
import {
	createTsTypeResolver,
	deepSimplifySchema,
	isInvalidPropertyName,
	normalizeUnknownTypeName,
	shouldStubMantineExpandedProps,
	simplifySchema,
} from "./tsTypeResolver.ts";

const projectRoot = path.resolve(__dirname, "../..");

describe("mantine-props mirror resolution", () => {
	const resolver = createTsTypeResolver(projectRoot);

	it("resolves MantineGroupProps from schema-input", () => {
		const resolved = resolver.tryResolveLocalTypeName("MantineGroupProps");
		expect(resolved).toBeDefined();
		expect(resolved).toHaveProperty("properties");
		const props = (resolved as {properties: Record<string, unknown>}).properties;
		expect(props).toHaveProperty("w");
		expect(props).toHaveProperty("justify");
	});

	it("resolves Pick<MantineGroupProps, 'p'> via TypeDoc node", () => {
		const resolved = resolver.tryResolveTypeDocNode({
			type: "reference",
			name: "Pick",
			typeArguments: [
				{type: "reference", name: "MantineGroupProps"},
				{
					type: "union",
					types: [{type: "literal", value: "p"}],
				},
			],
		});
		expect(resolved).toBeDefined();
		expect(resolved).toHaveProperty("properties");
		const props = (resolved as {properties: Record<string, unknown>}).properties;
		expect(Object.keys(props)).toEqual(["p"]);
	});
});

describe("normalizeUnknownTypeName", () => {
	it("shortens constructor, iterator, and long function types", () => {
		expect(normalizeUnknownTypeName("new (props: Foo) => Bar")).toBe(
			"ReactNode",
		);
		expect(normalizeUnknownTypeName("ComponentConstructor")).toBe(
			"ReactNode",
		);
		expect(
			normalizeUnknownTypeName("IterableIterator<ReactNode> __@iterator@"),
		).toBe("ReactNode");
		expect(
			normalizeUnknownTypeName("Partial<Record<`--mantine-color-red`, string>>"),
		).toBe("ResponsiveCSSVariables");
		expect(
			normalizeUnknownTypeName(
				"(theme: MantineTheme, props: ButtonProps, ctx: unknown) => Partial<Record<ButtonStylesNames, string>>",
			),
		).toBe("CSSProperties");
	});

	it("maps React union members to ReactNode", () => {
		expect(
			normalizeUnknownTypeName(
				"ReactElement<any, string | JSXElementConstructor<any>>",
			),
		).toBe("ReactNode");
		expect(normalizeUnknownTypeName("Iterable<ReactNode>")).toBe(
			"ReactNode",
		);
	});
});

describe("deepSimplifySchema", () => {
	it("simplifies nested oneOf inside properties", () => {
		const simplified = deepSimplifySchema({
			properties: {
				size: {
					oneOf: [
						{type: "string", const: "md"},
						{type: "string", const: "lg"},
						{type: "string"},
					],
				},
			},
		});
		expect(simplified).toEqual({
			properties: {
				size: {type: "string"},
			},
		});
	});
});

describe("simplifySchema", () => {
	it("collapses ReactNode variants and dedupes boolean in children union", () => {
		const simplified = simplifySchema({
			oneOf: [
				{type: "string"},
				{type: "number"},
				{type: "boolean"},
				{type: "boolean"},
				{
					type: "unknown",
					name: "ReactElement<any, string | JSXElementConstructor<any>>",
				},
				{type: "unknown", name: "Iterable<ReactNode>"},
				{type: "unknown", name: "ReactPortal"},
			],
		});
		expect(simplified).toEqual({
			oneOf: [
				{type: "string"},
				{type: "number"},
				{type: "boolean"},
				{type: "unknown", name: "ReactNode"},
			],
		});
	});
});

describe("isInvalidPropertyName", () => {
	it("filters iterator symbol pollution from React children unions", () => {
		expect(isInvalidPropertyName("__@iterator@25623")).toBe(true);
		expect(isInvalidPropertyName("Symbol.iterator")).toBe(true);
		expect(isInvalidPropertyName("children")).toBe(false);
	});
});

describe("shouldStubMantineExpandedProps", () => {
	it("stubs @mantine/core Props above lower thresholds", () => {
		const target = {
			packageName: "@mantine/core",
			fileName: "node_modules/@mantine/core/lib/components/Button/Button.d.ts",
		};
		expect(shouldStubMantineExpandedProps("ButtonProps", 60, target)).toBe(
			true,
		);
		expect(shouldStubMantineExpandedProps("ButtonProps", 40, target)).toBe(
			false,
		);
		expect(shouldStubMantineExpandedProps("MantineGradient", 90, target)).toBe(
			true,
		);
	});
});

describe("createTsTypeResolver", () => {
	const resolver = createTsTypeResolver(projectRoot);

	it("collectLiteralKeys reads union of string literals", () => {
		expect(
			resolver.collectLiteralKeys({
				type: "union",
				types: [
					{type: "literal", value: "src"},
					{type: "literal", value: "alt"},
				],
			}),
		).toEqual(["src", "alt"]);
	});

	it("expands Omit<ImageProps, src | alt | onError> from Mantine .d.ts", () => {
		const imageDts = path.normalize(
			path.join(
				projectRoot,
				"node_modules/@mantine/core/lib/components/Image/Image.d.ts",
			),
		);
		expect(fs.existsSync(imageDts)).toBe(true);

		const expanded = resolver.tryResolveTypeDocNode({
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

		expect(expanded).toHaveProperty("properties");
		const props = (expanded as {properties: Record<string, unknown>}).properties;
		expect(props).toHaveProperty("fit");
		expect(props).toHaveProperty("fallbackSrc");
		expect(props).toHaveProperty("h");
		expect(props).toHaveProperty("w");
	});

	it("builds mantine doc link for ImageProps", () => {
		expect(resolver.mantineDocLinkForProps("ImageProps")).toBe(
			"https://mantine.dev/core/image/?t=props",
		);
	});

	it("resolves fz StyleProp responsive Partial<Record<breakpoint, value>>", () => {
		const expanded = resolver.tryResolveTypeDocNode({
			type: "reference",
			name: "MantineStyleProps",
			_target: {
				packageName: "@mantine/core",
				packagePath:
					"lib/core/Box/style-props/style-props.types.d.ts",
				qualifiedName: "MantineStyleProps",
			},
		});

		expect(expanded).toHaveProperty("properties");
		const fz = (
			expanded as {properties: Record<string, {oneOf?: unknown[]}>}
		).properties.fz;
		expect(fz).toBeDefined();
		expect(fz.oneOf).toBeDefined();

		const responsive = fz.oneOf?.find(
			(member) =>
				typeof member === "object" &&
				member !== null &&
				"properties" in member &&
				(member as {properties?: Record<string, unknown>}).properties
					?.xs !== undefined,
		);
		expect(responsive).toBeDefined();

		const opaquePartial = fz.oneOf?.find(
			(member) =>
				typeof member === "object" &&
				member !== null &&
				"type" in member &&
				(member as {type?: string; name?: string}).type ===
					"unknown" &&
				(member as {name?: string}).name?.includes("Partial<Record"),
		);
		expect(opaquePartial).toBeUndefined();
	});

	it("does not expand MantineTheme into inline properties", () => {
		const expanded = resolver.tryResolveTypeDocNode({
			type: "reference",
			name: "MantineTheme",
			_target: {
				packageName: "@mantine/core",
				packagePath: "lib/core/MantineProvider/theme.types.d.ts",
				qualifiedName: "MantineTheme",
			},
		});

		expect(expanded).toEqual({
			type: "unknown",
			name: "MantineTheme",
			docLink: "https://mantine.dev/theming/theme-object/",
		});
	});

	it("resolves local icon style interface from source file context", () => {
		resolver.setSourceFileContext(
			"src/shared/widgets/appbuilder/ui/ViewportAcceptRejectButtons.tsx",
		);
		const expanded = resolver.tryResolveTypeInSourceFile(
			"ViewportAcceptRejectButtonsIconStyleProps",
			"src/shared/widgets/appbuilder/ui/ViewportAcceptRejectButtons.tsx",
		);

		expect(expanded).toEqual({
			properties: {
				size: {
					oneOf: [{type: "string"}, {type: "number"}],
				},
				color: {type: "string"},
			},
		});
	});

	it("resolves Mantine ButtonProps from schema-input mirror", () => {
		const expanded = resolver.tryResolveTypeDocNode({
			type: "reference",
			name: "ButtonProps",
			_target: {
				packageName: "@mantine/core",
				packagePath: "lib/components/Button/Button.d.ts",
				qualifiedName: "ButtonProps",
			},
		});

		expect(expanded).toHaveProperty("properties");
		const props = (expanded as {properties: Record<string, unknown>}).properties;
		expect(props).toHaveProperty("fw");
		expect(props).toHaveProperty("mt");
		expect(props).toHaveProperty("variant");
	});

	it("resolves ViewportIconButton iconProps intersection from source types", () => {
		resolver.setSourceFileContext(
			"src/shared/entities/viewport/ui/ViewportIconButton.tsx",
		);
		const expanded = resolver.tryResolveTypeDocNode({
			type: "intersection",
			types: [
				{
					type: "indexedAccess",
					objectType: {
						type: "reference",
						name: "ViewportIconButtonStyleProps",
					},
					indexType: {type: "literal", value: "iconProps"},
				},
				{
					type: "reference",
					name: "Partial",
					typeArguments: [
						{type: "reference", name: "IconProps"},
					],
				},
			],
		});

		expect(expanded).toHaveProperty("properties");
		const props = (
			expanded as {properties: Record<string, unknown>}
		).properties;
		expect(props.color).toBeDefined();
		expect(props.colorDisabled).toBeDefined();
		expect(props.iconType).toBeDefined();
	});

	it("resolves MantineGradient to from/to/deg properties", () => {
		const expanded = resolver.tryResolveTypeDocNode({
			type: "reference",
			name: "MantineGradient",
			_target: {
				packageName: "@mantine/core",
				packagePath: "lib/core/MantineProvider/theme.types.d.ts",
				qualifiedName: "MantineGradient",
			},
		});

		expect(expanded).toEqual({
			properties: {
				from: {type: "string"},
				to: {type: "string"},
				deg: {type: "number"},
			},
		});
	});
});
