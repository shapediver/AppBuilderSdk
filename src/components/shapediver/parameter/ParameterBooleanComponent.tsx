import { Skeleton, Switch } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { useShapediverViewerStore } from "../../../context/shapediverViewerStore";
import ParameterLabelComponent from "./ParameterLabelComponent";

interface Props {
    // The unique identifier to use to access the session.
    sessionId: string,
    // The unique identifier to use to access the parameter.
    parameterId: string
}

/**
 * Functional component that creates a button for a boolean parameter.
 * It displays a Skeleton if the session is not accessible yet.
 * 
 * @returns 
 */
export default function ParameterBooleanComponent({ sessionId, parameterId }: Props): JSX.Element {
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

            const parameter = session.parameters[parameterId];
            const defaultValue = (parameter.value === true || parameter.value === "true");

            // callback for when the value was changed
            const handleChange = (value: boolean) => {
                activeSessions[sessionId].then((session) => {
                    if (!session) return;

                    // set the value and customize the session
                    parameter.value = value;
                    session.customize();
                })
            }

            // set the element with the label and a switch which triggers the handleChange-callback
            setElement(
                <>
                    <ParameterLabelComponent sessionId={sessionId} parameterId={parameterId} />
                    <Switch
                        styles={() => ({
                            track: { cursor: "pointer" },
                        })}
                        size="md"
                        defaultChecked={defaultValue}
                        onChange={(event) => handleChange(event.currentTarget.checked)}
                    />
                </>
            );
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