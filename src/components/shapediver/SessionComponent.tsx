import { createSession } from "@shapediver/viewer";
import { useEffect, useRef } from "react";
import { useShapediverViewerStore } from "../../context/shapediverViewerStore";

interface Props {
    // The ticket for direct embedding of the model to create a session for. This identifies the model on the Geometry Backend.
    ticket: string,
    // The modelViewUrl of the ShapeDiver Geometry Backend hosting the model.
    modelViewUrl: string,
    // The JWT to use for authorizing the API calls to the Geometry Backend.
    jwtToken?: string,
    // The unique identifier to use for the session.
    id: string,
    // Option to wait for the outputs to be loaded, or return immediately after creation of the session. (default: true)
    waitForOutputs?: boolean,
    // Option to load the outputs, or not load them until the first call of customize. (default: true)
    loadOutputs?: boolean,
    // Option to exclude some viewports from the start.
    excludeViewports?: string[],
    // The initial set of parameter values to use. Map from parameter id to parameter value. The default value will be used for any parameter not specified.
    initialParameterValues?: { [key: string]: string }
}

/**
 * Functional component that creates a session with the specified properties.
 * 
 * @returns 
 */
export default function SessionComponent({ id, ticket, modelViewUrl, jwtToken, waitForOutputs, loadOutputs, excludeViewports, initialParameterValues }: Props): JSX.Element {
    const activeSessionsRef = useRef(useShapediverViewerStore(state => state.activeSessions));

    useEffect(() => {
        // if there is already a session with the same unique id registered
        // we wait until that session is closed until we create this session anew
        // the closing of the session is done on unmount
        // this can happen in development mode due to the duplicate calls of react
        // read about that here: https://reactjs.org/docs/strict-mode.html#ensuring-reusable-state

        const activeSessions = activeSessionsRef.current;
        const activeSession = activeSessions[id] || Promise.resolve();

        // we set a new promise with the new session
        activeSessions[id] = activeSession
            .then(() => createSession({
                id: id,
                ticket: ticket,
                modelViewUrl: modelViewUrl,
                jwtToken: jwtToken,
                waitForOutputs: waitForOutputs,
                loadOutputs: loadOutputs,
                excludeViewports: excludeViewports,
                initialParameterValues: initialParameterValues
            }));
        // and then save it in the store
        useShapediverViewerStore.setState({ activeSessions })

        return () => {
            // when the session is closed, we close the session and assign that promise
            activeSessions[id] = activeSessions[id].then(async s => s && await s.close());
        }
    }, [id, ticket, modelViewUrl, jwtToken, waitForOutputs, loadOutputs, excludeViewports, initialParameterValues]);

    return (<></>);
};
