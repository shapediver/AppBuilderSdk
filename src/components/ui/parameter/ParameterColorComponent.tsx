import { ActionIcon, ColorInput, Skeleton } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useShapeDiverViewerStore } from "../../../app/shapediver/viewerStore";
import ParameterLabelComponent from "./ParameterLabelComponent";

interface Props {
    sessionId: string,
    parameterId: string
}

export default function ParameterColorComponent({ sessionId, parameterId }: Props): JSX.Element {
    const activeSessionsRef = useRef(useShapeDiverViewerStore(state => state.activeSessions));
    const colorInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);
    const [element, setElement] = useState(<></>);

    useEffect(() => {
        const activeSessions = activeSessionsRef.current;
        const activeSession = activeSessions[sessionId] || Promise.resolve();

        activeSession.then((session) => {
            setLoading(false);

            if (session) {
                const parameter = session.parameters[parameterId];
                const defaultValue = (parameter.value).replace("0x", "#").substring(0, 7);

                const handleChange = (value: string) => {
                    activeSessions[sessionId].then((session) => {
                        if (session) {
                            parameter.value = value;
                            session.customize();
                        }
                    })
                }

                setElement(
                    <>
                        <ParameterLabelComponent sessionId={sessionId} parameterId={parameterId} />
                        <ColorInput 
                            ref={colorInputRef}
                            defaultValue={defaultValue}
                            placeholder="Pick color"
                            rightSection={
                                <ActionIcon onClick={() => {
                                        if(colorInputRef.current) colorInputRef.current.value = defaultValue;
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
    }, [sessionId, parameterId]);

    return (
        <>
            {loading && <Skeleton height={8} mt={6} radius="xl" />}
            {!loading && element}
        </>
    );
}