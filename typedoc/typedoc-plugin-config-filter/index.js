import fs from "fs";
import path from "path";
import {Converter} from "typedoc";
import {
	buildNestedDocRoot,
	dedupeFlatEntriesByConfigPath,
} from "./buildArtifacts.js";

export function load(app) {
	console.log("Plugin loading...");

	// Hook into the end of the conversion process (before rendering)
	app.converter.on(Converter.EVENT_RESOLVE_END, (context) => {
		console.log("Plugin executing at converter RESOLVE_END...");

		try {
			const project = context.project;
			const rawWithPath = [];

			if (!project?.reflections) return;

			const getText = (arr) =>
				arr ? arr.map((s) => s.text).join("") : "";

			const processTagValue = (value) => {
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

				const entry = {
					configPath,
					name: displayNameTag
						? getText(displayNameTag.content).trim()
						: reflection.name,
					summary: getText(reflection.comment?.summary),
					source: reflection.sources?.[0]?.fileName || "unknown",
				};

				if (reflection.children?.length) {
					entry.properties = reflection.children.map((child) => {
						const prop = {
							name: child.name,
							description: getText(child.comment?.summary),
							type: child.type?.toString() || "unknown",
						};

						const childTags = child.comment?.blockTags;
						if (childTags) {
							for (const tag of childTags) {
								const tagName = tag.tag;
								if (
									tagName === "@default" ||
									tagName === "@minimum" ||
									tagName === "@maximum" ||
									tagName === "@example"
								) {
									const key = tagName.substring(1);
									prop[key] = processTagValue(
										getText(tag.content),
									);
								}
							}
						}

						return prop;
					});
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
