import { Skeleton, Switch } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { useShapeDiverViewerStore } from "../../../app/shapediver/viewerStore";
import ParameterLabelComponent from "./ParameterLabelComponent";

interface Props {
    sessionId: string,
    parameterId: string
}

export default function ParameterBooleanComponent({ sessionId, parameterId }: Props): JSX.Element {
    const activeSessionsRef = useRef(useShapeDiverViewerStore(state => state.activeSessions));
    const [loading, setLoading] = useState(true);
    const [element, setElement] = useState(<></>);

    useEffect(() => {
        const activeSessions = activeSessionsRef.current;
        const activeSession = activeSessions[sessionId] || Promise.resolve();

        activeSession.then((session) => {
            setLoading(false);

            if (session) {
                const parameter = session.parameters[parameterId];
                const defaultValue = (parameter.value === true || parameter.value === "true");

                const handleChange = (value: boolean) => {
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
                        <Switch
                            defaultChecked={defaultValue}
                            onChange={(event) => handleChange(event.currentTarget.checked)}
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