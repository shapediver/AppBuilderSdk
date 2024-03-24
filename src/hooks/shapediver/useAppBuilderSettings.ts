import { useMemo } from "react";
import useAsync from "../misc/useAsync";
import { IAppBuilderSettings, IAppBuilderSettingsSession } from "types/shapediver/appbuilder";
import useResolveAppBuilderSettings from "./useResolveAppBuilderSettings";
import { validateAppBuilderSettings } from "types/shapediver/appbuildertypecheck";

const PROD_PLATFORM_HOST = "shapediver.com";
const STAGING_PLATFORM_HOST = "staging-wwwcdn.us-east-1.shapediver.com";
const DEV_PLATFORM_HOST = "dev-wwwcdn.us-east-1.shapediver.com";
const SANDBOX_PLATFORM_HOST = "sandbox-wwwcdn.us-east-1.shapediver.com";
function getDefaultPlatformUrl() {
	const hostname = window.location.hostname;
	if (hostname === STAGING_PLATFORM_HOST || hostname === "staging-spa.us-east-1.shapediver.com")
		return `https://${STAGING_PLATFORM_HOST}`;
	else if (hostname === DEV_PLATFORM_HOST || hostname === "dev-spa.us-east-1.shapediver.com")
		return `https://${DEV_PLATFORM_HOST}`;
	else if (hostname === SANDBOX_PLATFORM_HOST)
		return `https://${SANDBOX_PLATFORM_HOST}`;
	else
		return `https://${PROD_PLATFORM_HOST}`;
}

function isTrueish(value: string | null | undefined) {
	return value === "true" || value === "1";
}

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
	const validate = (data: any) : IAppBuilderSettings | undefined => {
		const result = validateAppBuilderSettings(data);
		if (result.success) {
			return result.data;
		}
		else {
			throw new Error(`Parsing AppBuilder settings failed: ${result.error.message}`);
		}
	};
	const { value, error, loading } = useAsync(async () => {
		if (!url) return;
		const response = await fetch(url, { mode: "cors" });
		
		return validate(await response.json());
	}, [url]);

	// check for ticket, modelViewUrl, slug and platformUrl
	const ticket = parameters.get("ticket");
	const modelViewUrl = parameters.get("modelViewUrl");
	const slug = parameters.get("slug");
	const platformUrl = parameters.get("platformUrl");
	const disableFallbackUi = isTrueish(parameters.get("disableFallbackUi"));

	// define fallback session settings to be used in case loading from json failed
	// in case slug and optionally platformUrl are defined, use them
	// otherwise, if ticket and modelViewUrl are defined, use them
	const queryParamSession = useMemo<IAppBuilderSettingsSession|undefined>(() => slug ? 
		{ id: "default", slug, platformUrl: platformUrl ?? getDefaultPlatformUrl() } as IAppBuilderSettingsSession : 
		(ticket && modelViewUrl ? { id: "default", ticket, modelViewUrl} : undefined), [slug, platformUrl, ticket, modelViewUrl]);

	// use settings loaded from json, or settings defined by query parameters, or default settings
	const settings = useMemo<IAppBuilderSettings|undefined>(
		() => !value && (defaultSession || queryParamSession) ? 
			{ version: "1.0", sessions: [(queryParamSession ?? defaultSession)!], settings: { disableFallbackUi } } : 
			value, 
		[value, defaultSession, queryParamSession]
	);

	const { settings: resolvedSettings, error: resolveError, loading: resolveLoading } = useResolveAppBuilderSettings(settings);

	return {
		settings: resolvedSettings, 
		error: error || resolveError, 
		loading: loading || resolveLoading,
		hasSettings: parameters.size > 0
	};
}
