import {
	SdPlatformModelGetEmbeddableFields,
	create as createSdk,
} from "@shapediver/sdk.platform-api-sdk-v1";

import dotenv from "dotenv";
import {writeFileSync} from "fs";

import {SLUGS} from "../modelstorage.slugs.ts";

async function getPlatformAccessToken() {
	try {
		const platformAccessTokenKey = process.env.PLATFORM_ACCESS_TOKEN_KEY;
		const platformAccessTokenSecret =
			process.env.PLATFORM_ACCESS_TOKEN_SECRET;
		const platformUrl = process.env.PLATFORM_URL;
		const clientId = process.env.PLATFORM_CLIENT_ID;

		console.log(
			platformAccessTokenKey,
			platformAccessTokenSecret,
			platformUrl,
			clientId,
		);

		if (!platformAccessTokenKey || !platformAccessTokenSecret) {
			console.log(
				"PLATFORM_ACCESS_TOKEN_KEY and/or PLATFORM_ACCESS_TOKEN_SECRET not found in .env.local",
			);
			console.log(`Writing empty access token to ${OUTPUT_FILE}`);
			writeFileSync(
				OUTPUT_FILE,
				"export const MODEL_STORAGE = { ACCESS_TOKEN: '', };",
			);
			return;
		}

		if (!clientId) {
			console.error("PLATFORM_CLIENT_ID not found in .env.local");
			writeFileSync(
				OUTPUT_FILE,
				"export const MODEL_STORAGE = { ACCESS_TOKEN: '', };",
			);
			return;
		}

		console.log("Found platform access token key and secret in .env.local");
		console.log("Connecting to the platform...");

		const client = createSdk({
			clientId,
			baseUrl: platformUrl,
		});

		console.log("Requesting platform access token...");

		const result = await client.authorization.passwordGrant(
			platformAccessTokenKey,
			platformAccessTokenSecret,
		);

		// loop through slugs from modelstorage.slugs.ts and add them to the MODELS object
		const modelDefinitions: {
			[key: string]: {
				ticket: string;
				modelViewUrl: string;
			};
		} = {};

		const promises = [];

		for (const slug of slugs) {
			console.log(`Retrieving model definition for slug: ${slug}`);
			const modelDef = client.models
				.get(slug, [
					SdPlatformModelGetEmbeddableFields.BackendSystem,
					SdPlatformModelGetEmbeddableFields.Tags,
					SdPlatformModelGetEmbeddableFields.Ticket,
					SdPlatformModelGetEmbeddableFields.TokenExportFallback,
					SdPlatformModelGetEmbeddableFields.User,
				])
				.then((response) => {
					const data = response?.data;
					return {
						ticket: data!.ticket!.ticket!,
						modelViewUrl: data!.backend_system!.model_view_url,
					};
				});

			promises.push(modelDef);
		}

		const modelDefs = await Promise.all(promises);

		slugs.forEach((slug, index) => {
			modelDefinitions[slug] = modelDefs[index];
		});

		const config = `export const MODEL_STORAGE = { ACCESS_TOKEN: '${result.access_token}', MODELS: ${JSON.stringify(
			modelDefinitions,
			null,
			4,
		)}, };`;

		writeFileSync(OUTPUT_FILE, config);

		console.log(
			`Platform access token retrieved and saved to ${OUTPUT_FILE}`,
		);
	} catch (error) {
		console.error("Failed to get platform access token:", error);
		console.log(`Writing empty access token to ${OUTPUT_FILE}`);
		writeFileSync(
			OUTPUT_FILE,
			"export const MODEL_STORAGE = { ACCESS_TOKEN: '', MODELS: {}, };",
		);
		process.exit(1);
	}
}

const OUTPUT_FILE = "modelstorage.local.ts";
const slugs: string[] = SLUGS || [];

// Load environment variables from .env.platform-access
dotenv.config({path: ".env.platform-access"});

getPlatformAccessToken();
