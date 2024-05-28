import { useEffect, useMemo } from "react";
import useAsync from "../../misc/useAsync";
import { IAppBuilderSettings, IAppBuilderSettingsJson, IAppBuilderSettingsSession } from "types/shapediver/appbuilder";
import useResolveAppBuilderSettings from "./useResolveAppBuilderSettings";
import { validateAppBuilderSettingsJson } from "types/shapediver/appbuildertypecheck";
import { useThemeOverrideStore } from "store/useThemeOverrideStore";
import { getDefaultPlatformUrl } from "utils/shapediver";

/**
 * Test a string value for being "true" or "1".
 * @param value 
 * @returns 
 */
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
	const validate = (data: any) : IAppBuilderSettingsJson | undefined => {
		const result = validateAppBuilderSettingsJson(data);
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
	const modelViewUrl = parameters.get("modelViewUrl")?.replace(/\/+$/, "");
	const slug = parameters.get("slug");
	const platformUrl = parameters.get("platformUrl")?.replace(/\/+$/, "");
	const disableFallbackUi = isTrueish(parameters.get("disableFallbackUi"));
	const template = parameters.get("template");
	
	// define fallback session settings to be used in case loading from json failed
	// in case slug and optionally platformUrl are defined, use them
	// otherwise, if ticket and modelViewUrl are defined, use them
	const queryParamSession = useMemo<IAppBuilderSettingsSession|undefined>(() => slug ? 
		{ id: "default", slug, platformUrl: platformUrl ?? getDefaultPlatformUrl() } as IAppBuilderSettingsSession : 
		(ticket && modelViewUrl ? { id: "default", ticket, modelViewUrl} : undefined), [slug, platformUrl, ticket, modelViewUrl]);

	// define theme overrides based on query string params
	const themeOverrides = useMemo(() => { return template ? {
		components: {
			AppBuilderTemplateSelector: {
				defaultProps: {
					template: template
				}
			}
		}
	} : undefined;}, [template]);

	// use settings loaded from json, or settings defined by query parameters, or default settings
	const settings = useMemo<IAppBuilderSettings|undefined>(
		() => !value && (defaultSession || queryParamSession) ? 
			{ 
				version: "1.0", 
				sessions: [(queryParamSession ?? defaultSession)!], 
				settings: { disableFallbackUi },
				themeOverrides: themeOverrides
			} : (value ? 
				{ sessions: defaultSession || queryParamSession ? [(queryParamSession ?? defaultSession)!] : [], ...value } : undefined), 
		[value, defaultSession, queryParamSession, themeOverrides]
	);

	// register theme overrides
	const setThemeOverride = useThemeOverrideStore(state => state.setThemeOverride);
	useEffect(() => {
		console.debug("Theme overrides", value);
		setThemeOverride(settings?.themeOverrides);
	}, [settings?.themeOverrides]);
	
	const { settings: resolvedSettings, error: resolveError, loading: resolveLoading } = useResolveAppBuilderSettings(settings);
	
	return {
		settings: resolvedSettings, 
		error: error || resolveError, 
		loading: loading || resolveLoading,
		hasSettings: parameters.size > 0,
		hasSession: (settings?.sessions && settings.sessions.length > 0) || (resolvedSettings?.sessions && resolvedSettings.sessions.length > 0)
	};
}
