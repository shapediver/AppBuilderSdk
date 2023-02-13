import { Select, Skeleton } from "@mantine/core";
import { useEffect, useRef, useState } from "react";
import { useShapediverViewerStore } from "../../../context/shapediverViewerStore";
import ParameterLabelComponent from "./ParameterLabelComponent";

interface Props {
    sessionId: string,
    parameterId: string
}

export default function ParameterSelectComponent({ sessionId, parameterId }: Props): JSX.Element {
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

                const handleChange = (value: string) => {
                    activeSessions[sessionId].then((session) => {
                        if (session) {
                            parameter.value = parameter.choices!.indexOf(value) + "";
                            session.customize();
                        }
                    })
                }

                setElement(
                    <>
                        <ParameterLabelComponent sessionId={sessionId} parameterId={parameterId} />
                        <Select
                            placeholder="Pick one"
                            defaultValue={parameter.choices![+parameter.defval]}
                            onChange={handleChange}
                            data={parameter.choices!}
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