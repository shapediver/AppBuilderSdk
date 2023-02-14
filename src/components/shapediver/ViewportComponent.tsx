import { createViewport, BUSY_MODE_DISPLAY, SESSION_SETTINGS_MODE, SPINNER_POSITIONING, VISIBILITY_MODE } from "@shapediver/viewer";
import { useEffect, useRef } from "react";
import { useShapediverViewerStore } from '../../context/shapediverViewerStore';

interface Props {
    id: string,
    branding?: {
        logo?: string | null,
        backgroundColor?: string,
        busyModeSpinner?: string,
        busyModeDisplay?: BUSY_MODE_DISPLAY,
        spinnerPositioning?: SPINNER_POSITIONING
    },
    sessionSettingsId?: string,
    sessionSettingsMode?: SESSION_SETTINGS_MODE,
    visibility?: VISIBILITY_MODE,
}

export default function ViewportComponent({ id, branding, sessionSettingsId, sessionSettingsMode, visibility }: Props): JSX.Element {
    const canvasRef = useRef(null);
    const activeViewportsRef = useRef(useShapediverViewerStore(state => state.activeViewports));

    useEffect(() => {
        // if there is already a viewport with the same unique id registered
        // we wait until that viewport is closed until we create this viewport anew
        // the closing of the viewport is done on unmount
        // this can happen in development mode due to the duplicate calls of react
        // read about that here: https://reactjs.org/docs/strict-mode.html#ensuring-reusable-state

        const activeViewports = activeViewportsRef.current;
        const activeViewport = activeViewports[id] || Promise.resolve();

        activeViewports[id] = activeViewport
            .then(() => createViewport({
                canvas: canvasRef.current!,
                id: id,
                branding: branding,
                sessionSettingsId: sessionSettingsId,
                sessionSettingsMode: sessionSettingsMode,
                visibility: visibility
            }))
        useShapediverViewerStore.setState({ activeViewports })


        // addListener(EVENTTYPE.SESSION.SESSION_CREATED, async (e) => {
        //     const sessionEvent: ISessionEvent = e as ISessionEvent;
        //     if((sessionSettingsId === sessionEvent.sessionId && sessionSettingsMode === SESSION_SETTINGS_MODE.MANUAL) || sessionSettingsMode === SESSION_SETTINGS_MODE.FIRST) {
        //         const v = await activeViewportsRef.current[id];
        //         if (v) {
        //             (v.camera as IPerspectiveCameraApi).zoomRestriction.maxDistance = 100;
        //             (v.camera as IPerspectiveCameraApi).zoomRestriction.minDistance = 90;
        //         }
        //     }
        // })

        return () => {
            activeViewports[id] = activeViewports[id].then(async s => s && await s.close());
        }
    }, [id, branding, sessionSettingsId, sessionSettingsMode, visibility]);

    return (<canvas ref={canvasRef} />)
};
