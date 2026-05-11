import * as fs from "fs";
import * as path from "path";
import {Application, Context, Converter} from "typedoc";
import {
	buildNestedDocRoot,
	collectDocFlatProperties,
	dedupeFlatEntriesByConfigPath,
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

				const props = collectDocFlatProperties(
					reflection,
					getText,
					processTagValue,
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
			const nested = buildNestedDocRoot(flat);

			const publicDir = "./public";
			if (!fs.existsSync(publicDir)) {
				fs.mkdirSync(publicDir, {recursive: true});
			}

			fs.writeFileSync(
				path.join(publicDir, "doc-flat.json"),
				JSON.stringify(flat, null, 2),
			);
			fs.writeFileSync(
				path.join(publicDir, "doc-nested.json"),
				JSON.stringify(nested, null, 2),
			);
			console.log(
				`Successfully generated doc-flat.json and doc-nested.json (${flat.length} entries)`,
			);
		} catch (error) {
			console.error("Plugin error:", error);
		}
	});
}
