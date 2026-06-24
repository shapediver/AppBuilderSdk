import {
	SdPlatformModelQueryEmbeddableFields,
	type SdPlatformQueryResponse,
	type SdPlatformResponseModelPublic,
	create as createSdk,
} from "@shapediver/sdk.platform-api-sdk-v1";

/**
 * Fetch all models owned by the dedicated production ShapeDiver testing account
 * and convert them into App Builder URLs for Playwright discovery.
 *
 * Required in .env.platform-access:
 * - PLATFORM_CLIENT_ID
 * - TESTING_ACCOUNT_PLATFORM_ACCESS_TOKEN_KEY
 * - TESTING_ACCOUNT_PLATFORM_ACCESS_TOKEN_SECRET
 */

import dotenv from "dotenv";

import {AppLink} from "./fetchAppLinks";

dotenv.config({path: ".env.platform-access"});

const PLATFORM_CLIENT_ID = process.env.PLATFORM_CLIENT_ID;
const PLATFORM_ACCESS_TOKEN_KEY =
	process.env.TESTING_ACCOUNT_PLATFORM_ACCESS_TOKEN_KEY;
const PLATFORM_ACCESS_TOKEN_SECRET =
	process.env.TESTING_ACCOUNT_PLATFORM_ACCESS_TOKEN_SECRET;
const PLATFORM_BASE_URL = "https://app.shapediver.com";
const APP_BUILDER_LATEST_URL =
	"https://appbuilder.shapediver.com/v1/main/latest/";
const PAGE_LIMIT = 100;

function requireEnv(value: string | undefined, name: string): string {
	if (!value) {
		throw new Error(
			`[global-setup] Missing ${name}. Set it in the environment or in .env.platform-access.`,
		);
	}

	return value;
}

export async function fetchTestingAccountLinks(): Promise<AppLink[]> {
	const clientId = requireEnv(PLATFORM_CLIENT_ID, "PLATFORM_CLIENT_ID");
	const accessTokenKey = requireEnv(
		PLATFORM_ACCESS_TOKEN_KEY,
		"TESTING_ACCOUNT_PLATFORM_ACCESS_TOKEN_KEY",
	);
	const accessTokenSecret = requireEnv(
		PLATFORM_ACCESS_TOKEN_SECRET,
		"TESTING_ACCOUNT_PLATFORM_ACCESS_TOKEN_SECRET",
	);

	const client = createSdk({
		clientId,
		baseUrl: PLATFORM_BASE_URL,
	});

	await client.authorization.passwordGrant(accessTokenKey, accessTokenSecret);

	const ownerId = client.authorization.authData.userId;
	if (!ownerId) {
		throw new Error(
			"[global-setup] ShapeDiver authentication succeeded but no user id was returned.",
		);
	}

	const ownedLinks = new Map<string, AppLink>();
	let offset: string | null | undefined = null;

	do {
		const response: SdPlatformQueryResponse<SdPlatformResponseModelPublic> =
			await client.models.query({
				limit: PAGE_LIMIT,
				offset,
				embed: [SdPlatformModelQueryEmbeddableFields.User],
				filters: {user_id: ownerId},
			});

		for (const model of response.data.result) {
			ownedLinks.set(model.slug, {
				slug: model.slug,
				url: `${APP_BUILDER_LATEST_URL}?slug=${encodeURIComponent(model.slug)}`,
				source: "TESTING_ACCOUNT",
			});
		}

		offset = response.data.pagination.next_offset;
	} while (offset);

	return [...ownedLinks.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}
