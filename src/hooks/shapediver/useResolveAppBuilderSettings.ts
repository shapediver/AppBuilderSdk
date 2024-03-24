import useAsync from "../misc/useAsync";
import { IAppBuilderSettings } from "types/shapediver/appbuilder";
import { create } from "@shapediver/sdk.platform-api-sdk-v1";
import { getDefaultPlatformUrl, isRunningInPlatform } from "./useAppBuilderSettings";

const DEFAULT_PLATFORM_CLIENT_ID = "920794fa-245a-487d-8abe-af569a97da42";

/**
 * In case the session settings contain a slug and a platformUrl, 
 * resolve the ticket, modelViewUrl and token from the platform.
 */
export default function useResolveAppBuilderSettings(settings : IAppBuilderSettings|undefined) {

	// try to get a token from the platform (refresh token grant)
	const { value: tokenResult } = useAsync(async () => {
		if (!isRunningInPlatform()) return;
		const platformUrl = getDefaultPlatformUrl();
		const client = create({ clientId: DEFAULT_PLATFORM_CLIENT_ID, baseUrl: platformUrl });
		try {
			const result = await client.authorization.refreshToken();
			
			return {
				jwtToken: result.access_token,
				platformUrl
			};
		} catch (error) {
			return {
				platformUrl
			};
		}
	});

	// resolve session data using iframe embedding or token
	const { value, error, loading } = useAsync(async () => {
		if (isRunningInPlatform() && !tokenResult) return;
		if (!settings) return;
		
		const sessions = await Promise.all(settings.sessions.map(async session => {
			if (!session.slug || !session.platformUrl)
				return session;
			
			const client = create({ clientId: DEFAULT_PLATFORM_CLIENT_ID, baseUrl: session.platformUrl });
			const result = await client.models.iframeEmbedding(session.slug);
			const iframeData = result.data;

			return {
				...session, 
				ticket: iframeData.ticket,
				modelViewUrl: iframeData.model_view_url,
				jwtToken: iframeData.token
			};
		}));

		const settingsResolved: IAppBuilderSettings = { 
			...settings, 
			sessions, 
			auth: tokenResult
		};

		return settingsResolved;
	}, [settings, tokenResult]);

	return {
		settings: value, 
		error, 
		loading
	};
}
