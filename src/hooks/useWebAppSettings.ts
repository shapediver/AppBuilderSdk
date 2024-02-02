import { useMemo } from "react";
import useAsync from "./useAsync";
import { SessionCreateDto } from "types/store/shapediverStoreViewer";

/**
 * Settings for a session used by the web app.
 */
export interface IWebAppSettingsSession extends SessionCreateDto {
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
export interface IWebAppSettings {
    "version": "1.0",
	/** Session to load. */
    "sessions": IWebAppSettingsSession[]
}

/**
 * Load settings for the web app from a JSON file defined by an URL query parameter.
 * 
 * @param defaultSession Default session definition to use if parameters could not be loaded.
 * @param queryParamName Name of the query parameter to use.
 * @returns 
 */
export default function useWebAppSettings(defaultSession?: IWebAppSettingsSession, queryParamName = "g") {

	const parameters = useMemo<URLSearchParams>(() => new URLSearchParams(window.location.search), []);
	const url = parameters.get(queryParamName);
	const { value, error, loading } = useAsync(async () => {
		if (!url) throw new Error();
		const response = await fetch(url, { mode: "cors" });
		
		return await response.json() as IWebAppSettings;
	});

	const settings : IWebAppSettings|undefined = error && defaultSession ? 
		{ version: "1.0", sessions: [defaultSession] } : value;

	return {
		settings, error, loading
	};
}