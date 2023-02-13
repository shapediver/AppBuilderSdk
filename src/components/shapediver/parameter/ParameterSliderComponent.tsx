import { Slider, Skeleton } from "@mantine/core";
import { PARAMETER_TYPE } from "@shapediver/viewer";
import { useEffect, useRef, useState } from "react";
import { useShapediverViewerStore } from "../../../context/shapediverViewerStore";
import ParameterLabelComponent from "./ParameterLabelComponent";

interface Props {
    sessionId: string,
    parameterId: string
}

export default function ParameterSliderComponent({ sessionId, parameterId }: Props): JSX.Element {
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

                let step = 1;
                if (parameter.type === PARAMETER_TYPE.INT) {
                    step = 1;
                } else if (parameter.type === PARAMETER_TYPE.EVEN || parameter.type === PARAMETER_TYPE.ODD) {
                    step = 2;
                } else {
                    step = 1 / Math.pow(10, parameter.decimalplaces!);
                }

                const handleChange = (value: number) => {
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
                        <Slider
                            label={(value) => {
                                if( parameter.type === PARAMETER_TYPE.INT || parameter.type === PARAMETER_TYPE.EVEN || parameter.type === PARAMETER_TYPE.ODD)
                                    return value.toFixed(0);
                                return value.toFixed(parameter.decimalplaces)
                            }}
                            defaultValue={+parameter.value}
                            min={+parameter.min!}
                            max={+parameter.max!}
                            step={step}
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