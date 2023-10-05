import {
	BUSY_MODE_DISPLAY,
	SESSION_SETTINGS_MODE,
	SPINNER_POSITIONING,
	VISIBILITY_MODE
} from "@shapediver/viewer";
import { useEffect, useRef } from "react";
import { useShapediverStoreViewer } from "store/shapediverStoreViewer";

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
	const { createViewport, closeViewport } = useShapediverStoreViewer();
	const canvasRef = useRef(null);

	useEffect(() => {
		createViewport({
			canvas: canvasRef.current!,
			id: id,
			branding: branding,
			sessionSettingsId: sessionSettingsId,
			sessionSettingsMode: sessionSettingsMode,
			visibility: visibility
		});

		return () => {
			closeViewport(id);
		};
	}, []);

	return {
		canvasRef
	};
}
