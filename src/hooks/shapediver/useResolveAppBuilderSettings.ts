import useAsync from "../misc/useAsync";
import { IAppBuilderSettings } from "types/shapediver/appbuilder";
import { create } from "@shapediver/sdk.platform-api-sdk-v1";

const DEFAULT_PLATFORM_CLIENT_ID = "920794fa-245a-487d-8abe-af569a97da42";

/**
 * In case the session settings contain a slug and a platformUrl, 
 * resolve the ticket, modelViewUrl and token from the platform.
 */
export default function useResolveAppBuilderSettings(settings : IAppBuilderSettings|undefined) {

	const { value, error, loading } = useAsync(async () => {
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

		return { ...settings, sessions };
	}, [settings]);

	return {
		settings: value, 
		error, 
		loading
	};
}
