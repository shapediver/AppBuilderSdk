import { useMemo } from "react";
import useAsync from "../misc/useAsync";
import { SessionCreateDto } from "types/store/shapediverStoreViewer";

const DEFAULT_PLATFORM_URL = "https://app.shapediver.com";

/**
 * Settings for a session used by the web app.
 */
export interface IUrlSearchParamSettingsSession extends SessionCreateDto {
	/**
	 * Either slug and platformUrl, or ticket and modelViewUrl must be set.
	 */
	slug?: string,
	/**
	 * Either slug and platformUrl, or ticket and modelViewUrl must be set.
	 */
	platformUrl?: string,
	/**
	 * Set to true to require confirmation of the user to accept or reject changed parameter values.
	 */
	acceptRejectMode?: boolean
}

/**
 * Settings for the web app.
 */
export interface IUrlSearchParamSettings {
    "version": "1.0",
	/** Session to load. */
    "sessions": IUrlSearchParamSettingsSession[]
}

/**
 * Load settings for the web app from a JSON file defined by an URL query parameter.
 * As an alternative, 
 * 
 * @param defaultSession Default session definition to use if parameters could not be loaded.
 * @param queryParamName Name of the query parameter to use for loading settings json.
 * @returns 
 */
export default function useUrlSearchParamSettings(defaultSession?: IUrlSearchParamSettingsSession, queryParamName = "g") {

	const parameters = useMemo<URLSearchParams>(() => new URLSearchParams(window.location.search), []);

	// try to load settings json
	const url = parameters.get(queryParamName);
	const { value, error, loading } = useAsync(async () => {
		if (!url) throw new Error();
		const response = await fetch(url, { mode: "cors" });
		
		return await response.json() as IUrlSearchParamSettings; // TODO validation
	});

	// check for ticket, modelViewUrl, slug and platformUrl
	const ticket = parameters.get("ticket");
	const modelViewUrl = parameters.get("modelViewUrl");
	const slug = parameters.get("slug");
	const platformUrl = parameters.get("platformUrl");

	// in case slug and optionally platformUrl are defined, use them
	// otherwise, if ticket and modelViewUrl are defined, use them
	const queryParamSession : IUrlSearchParamSettingsSession|undefined = slug ? 
		{ id: "default", slug, platformUrl: platformUrl ?? DEFAULT_PLATFORM_URL } as IUrlSearchParamSettingsSession : 
		(ticket && modelViewUrl ? { id: "default", ticket, modelViewUrl} : undefined);

	// use settings loaded from json, or settings defined by query parameters, or default settings
	const settings : IUrlSearchParamSettings|undefined = error && (defaultSession || queryParamSession) ? 
		{ version: "1.0", sessions: [(queryParamSession ?? defaultSession)!] } : value;

	return {
		settings, error, loading
	};
}