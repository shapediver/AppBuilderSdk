import { Skeleton, Text } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { useShapediverViewerStore } from "../../../context/shapediverViewerStore";

interface Props {
    // The unique identifier to use to access the session.
    sessionId: string,
    // The unique identifier to use to access the export.
    exportId: string
}

/**
 * Functional component that creates a label for an export.
 * It displays a Skeleton if the session is not accessible yet.
 * 
 * @returns 
 */
export default function ExportLabelComponent({ sessionId, exportId }: Props): JSX.Element {
    const activeSessionsRef = useRef(useShapediverViewerStore(state => state.activeSessions));
    const [loading, setLoading] = useState(true);
    const [element, setElement] = useState(<></>);

    useEffect(() => {
        // search for the session with the specified id in the active sessions
        const activeSessions = activeSessionsRef.current;
        const activeSession = activeSessions[sessionId];

        // early return if the session is not it the store (yet)
        if (!activeSession) return;

        activeSession.then((session) => {
            if (!session) return;

            // deactivate the loading mode
            setLoading(false);

            // create the label
            const exp = session.exports[exportId];
            setElement(<Text style={{ paddingBottom: "0.25rem" }} size="sm" fw={500}>{exp.displayname || exp.name}</Text>);
        })

        return () => { }
    }, [sessionId, exportId]);

    return (
        <>
            {loading && <Skeleton height={8} mt={6} radius="xl" />}
            {!loading && element}
        </>
    );
}