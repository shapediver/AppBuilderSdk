import { createSession } from "@shapediver/viewer";
import { useEffect, useRef } from "react";
import { useShapediverViewerStore } from "../../context/shapediverViewerStore";

interface Props {
    ticket: string,
    modelViewUrl: string,
    jwtToken?: string,
    id: string,
    waitForOutputs?: boolean,
    loadOutputs?: boolean,
    excludeViewports?: string[],
    initialParameterValues?: { [key: string]: string }
}

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
            }))
        useShapediverViewerStore.setState({ activeSessions })

        return () => {
            activeSessions[id] = activeSessions[id].then(async s => s && await s.close());
        }
    }, [id, ticket, modelViewUrl, jwtToken, waitForOutputs, loadOutputs, excludeViewports, initialParameterValues]);

    return (<></>);
};
