import * as fs from "fs";
import * as path from "path";
import {Application, Context, Converter} from "typedoc";
import {
	buildNestedDocRoot,
	collectDocFlatProperties,
	createDefinitionsContext,
	dedupeFlatEntriesByConfigPath,
	postProcessDefinitions,
	postProcessFlatEntries,
	wrapDocFlatEntries,
} from "./buildArtifacts.ts";

export function load(app: Application) {
	console.log("Plugin loading...");

	app.converter.on(Converter.EVENT_RESOLVE_END, (context: Context) => {
		console.log("Plugin executing at converter RESOLVE_END...");

		try {
			const project = context.project;
			const rawWithPath: any[] = [];

			if (!project?.reflections) return;

			const getText = (arr: any[] | undefined): string =>
				arr ? arr.map((s) => s.text).join("") : "";

			const processTagValue = (value: string): string => {
				return value
					.replace(/^```(ts|json|js)?\s*|\s*```$/g, "")
					.replace(/^"|"$/g, "")
					.trim();
			};

			const definitionsContext = createDefinitionsContext(
				project,
				getText,
				processTagValue,
				process.cwd(),
			);

			for (const reflection of Object.values(project.reflections)) {
				const blockTags = reflection.comment?.blockTags;
				if (!blockTags?.length) continue;

				const tagMap = new Map(blockTags.map((tag) => [tag.tag, tag]));

				if (!tagMap.has("@docAttached")) continue;

				const displayNameTag = tagMap.get("@displayName");
				const configPathTag = tagMap.get("@configPath");
				const configPath = configPathTag
					? getText(configPathTag.content).trim()
					: "";

				if (!configPath) {
					console.warn(
						"[typedoc-plugin-config-filter] @docAttached without @configPath:",
						reflection.name,
					);
					continue;
				}

				const entry: any = {
					configPath,
					name: displayNameTag
						? getText(displayNameTag.content).trim()
						: reflection.name,
					summary: getText(reflection.comment?.summary),
					source: reflection.sources?.[0]?.fileName || "unknown",
				};

				const docLinkTag = tagMap.get("@docLink");
				if (docLinkTag) {
					const link = processTagValue(
						getText(docLinkTag.content),
					).trim();
					if (link) {
						entry.docLink = link;
					}
				}

				const categoryTag = tagMap.get("@category");
				if (categoryTag) {
					const category = processTagValue(
						getText(categoryTag.content),
					).trim();
					if (category) {
						entry.category = category;
					}
				}

				definitionsContext.setEntrySourceFile(entry.source);

				const props = collectDocFlatProperties(
					reflection,
					getText,
					processTagValue,
					definitionsContext,
				);
				if (props.length) {
					entry.properties = props;
				}

				rawWithPath.push(entry);
			}

			const flat = dedupeFlatEntriesByConfigPath(rawWithPath, (p) =>
				console.warn(
					"[typedoc-plugin-config-filter] duplicate configPath:",
					p,
				),
			);

			postProcessDefinitions(
				definitionsContext.definitions,
				definitionsContext.tsMantineDocLinkForProps,
			);
			postProcessFlatEntries(
				flat,
				definitionsContext.definitions,
				process.cwd(),
			);

			const nested = {
				definitions: definitionsContext.definitions,
				...buildNestedDocRoot(flat),
			};

			const publicDir = "./public";
			if (!fs.existsSync(publicDir)) {
				fs.mkdirSync(publicDir, {recursive: true});
			}

			const docFlat = wrapDocFlatEntries(
				flat,
				definitionsContext.definitions,
			);

			fs.writeFileSync(
				path.join(publicDir, "doc-flat.json"),
				JSON.stringify(docFlat, null, 2),
			);
			fs.writeFileSync(
				path.join(publicDir, "doc-nested.json"),
				JSON.stringify(nested, null, 2),
			);
			console.log(
				`Successfully generated doc-flat.json and doc-nested.json (${flat.length} entries, ${Object.keys(definitionsContext.definitions).length} type definitions)`,
			);
			definitionsContext.disposePrograms?.();
		} catch (error) {
			console.error("Plugin error:", error);
		}
	});
}
