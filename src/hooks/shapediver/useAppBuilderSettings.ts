import { useMemo } from "react";
import useAsync from "../misc/useAsync";
import { IAppBuilderSettings, IAppBuilderSettingsSession } from "types/shapediver/appbuilder";
import useResolveAppBuilderSettings from "./useResolveAppBuilderSettings";

const DEFAULT_PLATFORM_URL = "https://app.shapediver.com";

/**
 * Load settings for the app builder from a JSON file defined by an URL query parameter.
 * As an alternative, use URL query parameters to define the session directly, based on 
 *   * ticket and modelViewUrl, or
 *   * slug and platformUrl.
 * 
 * @param defaultSession Default session definition to use if parameters could not be loaded.
 * @param queryParamName Name of the query parameter to use for loading settings json.
 * @returns 
 */
export default function useAppBuilderSettings(defaultSession?: IAppBuilderSettingsSession, queryParamName = "g") {

	const parameters = useMemo<URLSearchParams>(() => new URLSearchParams(window.location.search), []);

	// try to load settings json
	const url = parameters.get(queryParamName);
	const { value, error, loading } = useAsync(async () => {
		if (!url) return;
		const response = await fetch(url, { mode: "cors" });
		
		return await response.json() as IAppBuilderSettings; // TODO validation
	}, [url]);

	// check for ticket, modelViewUrl, slug and platformUrl
	const ticket = parameters.get("ticket");
	const modelViewUrl = parameters.get("modelViewUrl");
	const slug = parameters.get("slug");
	const platformUrl = parameters.get("platformUrl");

	// define fallback session settings to be used in case loading from json failed
	// in case slug and optionally platformUrl are defined, use them
	// otherwise, if ticket and modelViewUrl are defined, use them
	const queryParamSession = useMemo<IAppBuilderSettingsSession|undefined>(() => slug ? 
		{ id: "default", slug, platformUrl: platformUrl ?? DEFAULT_PLATFORM_URL } as IAppBuilderSettingsSession : 
		(ticket && modelViewUrl ? { id: "default", ticket, modelViewUrl} : undefined), [slug, platformUrl, ticket, modelViewUrl]);

	// use settings loaded from json, or settings defined by query parameters, or default settings
	const settings = useMemo<IAppBuilderSettings|undefined>(
		() => !value && (defaultSession || queryParamSession) ? 
			{ version: "1.0", sessions: [(queryParamSession ?? defaultSession)!] } : 
			value, 
		[value, defaultSession, queryParamSession]
	);

	const { settings: resolvedSettings, error: resolveError, loading: resolveLoading } = useResolveAppBuilderSettings(settings);

	return {
		settings: resolvedSettings, 
		error: error || resolveError, 
		loading: loading || resolveLoading
	};
}
