import { ActionIcon, ColorInput, Skeleton } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useShapediverViewerStore } from "../../../context/shapediverViewerStore";
import ParameterLabelComponent from "./ParameterLabelComponent";

interface Props {
    sessionId: string,
    parameterId: string
}

export default function ParameterColorComponent({ sessionId, parameterId }: Props): JSX.Element {
    const activeSessionsRef = useRef(useShapediverViewerStore(state => state.activeSessions));
    const [loading, setLoading] = useState(true);
    const [element, setElement] = useState(<></>);
    const [value, setValue] = useState("");

    useEffect(() => {
        const activeSessions = activeSessionsRef.current;
        const activeSession = activeSessions[sessionId] || Promise.resolve();

        activeSession.then((session) => {

            if (session) {
                const parameter = session.parameters[parameterId];
                const defaultValue = (parameter.defval).replace("0x", "#").substring(0, 7);
                if(loading === true) setValue(defaultValue);
                
                setLoading(false);

                const handleChange = (colorValue: string) => {
                    activeSessions[sessionId].then((session) => {
                        if (session) {
                            parameter.value = colorValue;
                            session.customize();
                        }
                    })
                }

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
                )
            }
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