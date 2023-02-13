import { Skeleton, Text } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { useShapediverViewerStore } from "../../../context/shapediverViewerStore";

interface Props {
    sessionId: string,
    parameterId: string
}

export default function ParameterLabelComponent({ sessionId, parameterId }: Props): JSX.Element {
    const activeSessionsRef = useRef(useShapediverViewerStore(state => state.activeSessions));
    const [loading, setLoading] = useState(true);
    const [element, setElement] = useState(<></>);

    useEffect(() => {
        const activeSessions = activeSessionsRef.current;
        const activeSession = activeSessions[sessionId] || Promise.resolve();

        activeSession.then((session) => {
            setLoading(false);

            if (session) {
                const parameter = session.parameters[parameterId];
                setElement(
                    <>
                        <Text style={{ paddingTop: "0.5rem", paddingBottom: "0.25rem" }} size="sm" fw={500}>{parameter.displayname || parameter.name}</Text>
                    </>
                )
            }
        })

        return () => { }
    }, [sessionId, parameterId]);

    return (
        <>
            {loading && <Skeleton height={8} mt={6} radius="xl" />}
            {!loading && element}
        </>
    );
}