import { ActionIcon, ColorInput, Skeleton } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
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
 * Functional component that creates a color swatch for a color parameter.
 * It displays a Skeleton if the session is not accessible yet.
 * 
 * @returns 
 */
export default function ParameterColorComponent({ sessionId, parameterId }: Props): JSX.Element {
    const activeSessionsRef = useRef(useShapediverViewerStore(state => state.activeSessions));
    const [loading, setLoading] = useState(true);
    const [element, setElement] = useState(<></>);
    const [value, setValue] = useState("");

    useEffect(() => {
        // search for the session with the specified id in the active sessions
        const activeSessions = activeSessionsRef.current;
        const activeSession = activeSessions[sessionId];

        // early return if the session is not it the store (yet)
        if (!activeSession) return;

        activeSession.then((session) => {
            if (!session) return;
            const parameter = session.parameters[parameterId];
            const defaultValue = (parameter.defval).replace("0x", "#").substring(0, 7);

            // set the default value
            if (loading === true) setValue(defaultValue);

            // deactivate the loading mode
            setLoading(false);

            // callback for when the value was changed
            const handleChange = (colorValue: string) => {
                activeSessions[sessionId].then((session) => {
                    if (!session) return;

                    // set the value and customize the session
                    parameter.value = colorValue;
                    session.customize();
                })
            }

            // set the element with the label and a color input that triggers the handleChange-callback onChangeEnd
            // a button is added to the right to reset the value to the default
            // NOTE: the onChange even does not trigger the handleChange-callback as this would send too many requests
            setElement(
                <>
                    <ParameterLabelComponent sessionId={sessionId} parameterId={parameterId} />
                    <ColorInput
                        styles={() => ({
                            input: { cursor: "pointer" }
                            // track: { cursor: "pointer" },
                        })}
                        placeholder="Pick color"
                        value={value}
                        onChange={setValue}
                        rightSection={
                            <ActionIcon onClick={() => {
                                setValue(defaultValue);
                                handleChange(defaultValue);
                            }}>
                                <IconRefresh size={16} />
                            </ActionIcon>
                        }
                        onChangeEnd={handleChange}
                    />
                </>
            );
        })

        return () => { }
    }, [sessionId, parameterId, loading, value]);

    return (
        <>
            {loading && <Skeleton height={8} mt={6} radius="xl" />}
            {!loading && element}
        </>
    );
}