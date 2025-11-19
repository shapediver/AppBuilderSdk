import {
	SdPlatformModelGetEmbeddableFields,
	SdPlatformResponseModelPublic,
	create as createSdk,
} from "@shapediver/sdk.platform-api-sdk-v1";

import dotenv from "dotenv";
import {writeFileSync} from "fs";

import {SLUGS} from "../modelstorage.slugs.ts";

/**
 * This is a utility script that can be used in local development to
 * retrieve a platform access token and model definitions for a set of slugs,
 * and save them to a local file (modelstorage.local.ts) that can be imported
 * in the app builder SDK.
 * With this, you can work with slugs on localhost without having to manually
 * search for the ticket and modelViewUrl ;)
 *
 * In order to use this script, create a .env.platform-access file in the root
 * of the project with the following variables:
 * - DEVELOPMENT_PLATFORM_ACCESS_TOKEN_KEY
 * - DEVELOPMENT_PLATFORM_ACCESS_TOKEN_SECRET
 * - STAGING_PLATFORM_ACCESS_TOKEN_KEY
 * - STAGING_PLATFORM_ACCESS_TOKEN_SECRET
 * - PRODUCTION_PLATFORM_ACCESS_TOKEN_KEY
 * - PRODUCTION_PLATFORM_ACCESS_TOKEN_SECRET
 * - PLATFORM_CLIENT_ID
 *
 * The *_PLATFORM_ACCESS_TOKEN_KEY and *_PLATFORM_ACCESS_TOKEN_SECRET can be
 * generated in the platform under "Settings" -> "Developers" -> "PLATFORM BACKEND API ACCESS KEYS".
 * You need the Models -> Read permission for this script to work.
 *
 * The PLATFORM_CLIENT_ID is 827bcbdc-8a5c-481a-b09a-e498074d91ca.
 *
 * You can add the slugs you want to retrieve model definitions for in the modelstorage.slugs.ts file
 * in the following format:
 *
 * export const SLUGS = {
	"development": [
		"slug1",
		"slug2",
	],
	"staging": [
		"slug3",
		"slug4",
	],
	"production": [],
};
 *
 * Once the setup is done, you can run this script using `npm run convertSlugData`.
 * After running, a modelstorage.local.ts file will be created/updated in the project root
 * that can be imported in the app builder SDK.
 */

const platformUrls = {
	development: "https://dev-wwwcdn.us-east-1.shapediver.com",
	staging: "https://staging-wwwcdn.us-east-1.shapediver.com",
	production: "https://app.shapediver.com",
};

async function getPlatformAccessToken() {
	try {
		const clientId = process.env.PLATFORM_CLIENT_ID;

		if (!clientId) {
			console.error(
				"PLATFORM_CLIENT_ID not found in .env.platform-access",
			);
			writeFileSync(
				OUTPUT_FILE,
				"export const MODELS = { ACCESS_TOKEN: '', };",
			);
			return;
		}

		console.log(
			"Found platform access token key and secret in .env.platform-access",
		);
		console.log("Connecting to the platform...");

		// loop through slugs from modelstorage.slugs.ts and add them to the MODELS object
		const modelDefinitions: {
			[key: string]: SdPlatformResponseModelPublic;
		} = {};

		// for each platform URL, get the slugs
		for (const [platform, slugs] of Object.entries(slugsPerPlatform)) {
			try {
				const platformUrl =
					platformUrls[platform as keyof typeof platformUrls];
				const client = createSdk({
					clientId,
					baseUrl: platformUrl,
				});

				console.log("Requesting platform access token...");

				const platformPrefix = platform.toUpperCase();

				const platformAccessTokenKey =
					process.env[`${platformPrefix}_PLATFORM_ACCESS_TOKEN_KEY`];
				const platformAccessTokenSecret =
					process.env[
						`${platformPrefix}_PLATFORM_ACCESS_TOKEN_SECRET`
					];
				if (!platformAccessTokenKey || !platformAccessTokenSecret) {
					console.log(
						`${platformPrefix}_PLATFORM_ACCESS_TOKEN_KEY and/or ${platformPrefix}_PLATFORM_ACCESS_TOKEN_SECRET not found in .env.platform-access`,
					);
					continue;
				}

				const result = await client.authorization.passwordGrant(
					platformAccessTokenKey,
					platformAccessTokenSecret,
				);

				const promises = [];

				for (const slug of slugs) {
					console.log(
						`Retrieving model definition for slug: ${slug}`,
					);

					const modelDef = client.models.get(slug, [
						SdPlatformModelGetEmbeddableFields.BackendSystem,
						SdPlatformModelGetEmbeddableFields.Tags,
						SdPlatformModelGetEmbeddableFields.Ticket,
						SdPlatformModelGetEmbeddableFields.TokenExportFallback,
						SdPlatformModelGetEmbeddableFields.User,
					]);

					promises.push(modelDef);
				}

				const modelDefs = await Promise.all(promises);

				slugs.forEach((slug, index) => {
					modelDefinitions[slug] = modelDefs[index].data;
				});
			} catch (error) {
				console.error(
					`Failed to retrieve model definitions for platform ${platform}:`,
					error,
				);
			}
		}

		const config = `export const MODELS = ${JSON.stringify(
			modelDefinitions,
			null,
			4,
		)};`;

		writeFileSync(OUTPUT_FILE, config);

		console.log(
			`Platform access token retrieved and saved to ${OUTPUT_FILE}`,
		);
	} catch (error) {
		console.error("Failed to get platform access token:", error);
		console.log(`Writing empty access token to ${OUTPUT_FILE}`);
		writeFileSync(OUTPUT_FILE, "export const MODELS = {};");
		process.exit(1);
	}
}

const OUTPUT_FILE = "modelstorage.local.ts";
const slugsPerPlatform: {[platform: string]: string[]} = SLUGS || {};

// Load environment variables from .env.platform-access
dotenv.config({path: ".env.platform-access"});

getPlatformAccessToken();
