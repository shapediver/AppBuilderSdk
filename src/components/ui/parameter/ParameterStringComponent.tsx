import { Skeleton, TextInput } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { useShapeDiverViewerStore } from "../../../app/shapediver/viewerStore";
import ParameterLabelComponent from "./ParameterLabelComponent";

interface Props {
    sessionId: string,
    parameterId: string
}

export default function ParameterStringComponent({ sessionId, parameterId }: Props): JSX.Element {
    const activeSessionsRef = useRef(useShapeDiverViewerStore(state => state.activeSessions));
    const textInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);
    const [element, setElement] = useState(<></>);

    useEffect(() => {
        const activeSessions = activeSessionsRef.current;
        const activeSession = activeSessions[sessionId] || Promise.resolve();

        activeSession.then((session) => {
            setLoading(false);

            if (session) {
                const parameter = session.parameters[parameterId];

                const handleChange = (value: string) => {
                    activeSessions[sessionId].then((session) => {
                        if (session) {
                            parameter.value = value;
                            session.customize();
                        }
                    })
                }

                let zoomResizeTimeout: NodeJS.Timeout;
                const handleDirectChange = () => {
                    clearTimeout(zoomResizeTimeout);
                    zoomResizeTimeout = setTimeout(() => {
                        if (textInputRef.current)
                            handleChange(textInputRef.current.value)
                    }, 500);
                }

                setElement(
                    <>
                        <ParameterLabelComponent sessionId={sessionId} parameterId={parameterId} />
                        <TextInput
                            ref={textInputRef}
                            style={{
                                flexGrow: 0.9
                            }}
                            defaultValue={parameter.value}
                            onChange={handleDirectChange}
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