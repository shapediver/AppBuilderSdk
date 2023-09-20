import {
	BUSY_MODE_DISPLAY,
	createViewport,
	SESSION_SETTINGS_MODE,
	SPINNER_POSITIONING,
	VISIBILITY_MODE
} from "@shapediver/viewer";
import { useEffect, useRef } from "react";
import { useShapediverStoreCommon } from "context/shapediverStoreCommon";

export interface IUseViewportProps {
	// The unique identifier to use for the viewport.
	id: string,
	// Optional branding options.
	branding?: {
		// Optional URL to a logo to be displayed while the viewport is hidden. A default logo will be used if none is provided. Supply null to display no logo at all.
		logo?: string | null,
		// Optional background color to show while the viewport is hidden, can include alpha channel. A default color will be used if none is provided.
		backgroundColor?: string,
		// Optional URL to a logo to be displayed while the viewport is in busy mode. A default logo will be used if none is provided. The positioning of the spinner can be influenced via SPINNER_POSITIONING.
		busyModeSpinner?: string,
		// The mode used to indicate that the viewport is busy. (default: BUSY_MODE_DISPLAY.SPINNER) Whenever the busy mode gets toggled, the events EVENTTYPE_VIEWPORT.BUSY_MODE_ON and EVENTTYPE_VIEWPORT.BUSY_MODE_OFF will be emitted.
		busyModeDisplay?: BUSY_MODE_DISPLAY,
		// Where the spinner that is specified by BUSY_MODE_DISPLAY is desplayed on the screen. (default: BUSY_MODE_DISPLAY.BOTTOM_RIGHT)
		spinnerPositioning?: SPINNER_POSITIONING
	},
	// Optional identifier of the session to be used for loading / persisting settings of the viewport when the SESSION_SETTINGS_MODE is set to MANUAL.
	sessionSettingsId?: string,
	// Allows to control which session to use for loading / persisting settings of the viewport. (default: SESSION_SETTINGS_MODE.FIRST).
	sessionSettingsMode?: SESSION_SETTINGS_MODE,
	// The visibility modes of the viewport.
	visibility?: VISIBILITY_MODE,
}

export function useViewport({ id, branding, sessionSettingsId, sessionSettingsMode, visibility }: IUseViewportProps) {
	const canvasRef = useRef(null);
	const activeViewportsRef = useRef(useShapediverStoreCommon(state => state.activeViewports));

	useEffect(() => {
		// if there is already a viewport with the same unique id registered
		// we wait until that viewport is closed until we create this viewport anew
		// the closing of the viewport is done on unmount
		// this can happen in development mode due to the duplicate calls of React
		// read about that here: https://reactjs.org/docs/strict-mode.html#ensuring-reusable-state
		const activeViewports = activeViewportsRef.current;
		const activeViewport = activeViewports[id] || Promise.resolve();

		// we set a new promise with the new viewport
		activeViewports[id] = activeViewport
			.then(() => createViewport({
				canvas: canvasRef.current!,
				id: id,
				branding: branding,
				sessionSettingsId: sessionSettingsId,
				sessionSettingsMode: sessionSettingsMode,
				visibility: visibility
			}));
		// and then save it in the store
		useShapediverStoreCommon.setState({ activeViewports });

		return () => {
			// when the component is closed, we close the viewport and assign that promise
			activeViewports[id] = activeViewports[id].then(async v => v && await v.close());
		};
	}, [id, branding, sessionSettingsId, sessionSettingsMode, visibility]);

	return {
		canvasRef
	};
}
