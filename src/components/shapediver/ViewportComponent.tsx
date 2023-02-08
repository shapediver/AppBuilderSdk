import '../../ViewportComponent.css';
import { createViewport, EVENTTYPE, IViewportApi, viewports, addListener, IViewportEvent, BUSY_MODE_DISPLAY, SESSION_SETTINGS_MODE, SPINNER_POSITIONING, VISIBILITY_MODE } from "@shapediver/viewer";
import React, { useEffect, useRef } from "react";

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

export default function ViewportComponent(props: Props): JSX.Element {
    const canvasRef = useRef(null);

    useEffect(() => {

        const create = (): Promise<IViewportApi> => {
            return createViewport({
                canvas: canvasRef.current!,
                id: props.id,
                branding: props.branding,
                sessionSettingsId: props.sessionSettingsId,
                sessionSettingsMode: props.sessionSettingsMode,
                visibility: props.visibility
            });
        }

        let viewportPromise: Promise<IViewportApi>;
        if (viewports[props.id]) {
            // if there is already a viewport with the same unique id registered
            // we wait until that viewport is closed until we create this viewport anew
            // the closing of the viewport is done on unmount
            // this can happen in development mode due to the duplicate calls of react
            // read about that here: https://reactjs.org/docs/strict-mode.html#ensuring-reusable-state
            viewportPromise = new Promise<IViewportApi>(resolve => {
                addListener(EVENTTYPE.VIEWPORT.VIEWPORT_CLOSED, async (e) => {
                    await new Promise<IViewportApi>(resolve => setTimeout(resolve, 0));
                    const viewportEvent = e as IViewportEvent;
                    if (viewportEvent.viewportId === props.id) {
                        viewportPromise = create();
                        resolve(viewportPromise)
                    }
                })
            })
        } else {
            viewportPromise = create();
        }

        return function cleanup() {
            // unmount 
            viewportPromise.then(v => v.close());
        }
    }, [props.id, props.branding, props.sessionSettingsId, props.sessionSettingsMode, props.visibility]);

    return (
        <div className="ViewportContainer">
            <canvas ref={canvasRef} />
        </div>
    )
};
