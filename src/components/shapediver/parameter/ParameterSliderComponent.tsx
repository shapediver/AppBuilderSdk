import { Slider, Skeleton, TextInput } from "@mantine/core";
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
    const textInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);
    const [element, setElement] = useState(<></>);
    const [value, setValue] = useState(0);
    const [textValue, setTextValue] = useState("");

    useEffect(() => {
        const activeSessions = activeSessionsRef.current;
        const activeSession = activeSessions[sessionId] || Promise.resolve();

        activeSession.then((session) => {

            if (session) {
                const parameter = session.parameters[parameterId];
                if (loading === true) {
                    setValue(+parameter.defval);
                    setTextValue(parameter.defval);
                } 
                setLoading(false);

                let step = 1;
                if (parameter.type === PARAMETER_TYPE.INT) {
                    step = 1;
                } else if (parameter.type === PARAMETER_TYPE.EVEN || parameter.type === PARAMETER_TYPE.ODD) {
                    step = 2;
                } else {
                    step = 1 / Math.pow(10, parameter.decimalplaces!);
                }

                const round = (n: number) => {
                    if (parameter.type === PARAMETER_TYPE.INT || parameter.type === PARAMETER_TYPE.EVEN || parameter.type === PARAMETER_TYPE.ODD)
                        n = +n.toFixed(0);
                    n = +n.toFixed(parameter.decimalplaces)
                    return n;
                }

                const handleChange = (inputValue: number) => {
                    activeSessions[sessionId].then((session) => {
                        if (session) {
                            parameter.value = round(inputValue);
                            session.customize();
                        }
                    })
                }

                let zoomResizeTimeout: NodeJS.Timeout;
                const handleDirectChange = () => {
                    if (textInputRef.current)
                        setTextValue(textInputRef.current.value)

                    clearTimeout(zoomResizeTimeout);
                    zoomResizeTimeout = setTimeout(() => {
                        if (!textInputRef.current) return;
                        if (isNaN(+textInputRef.current.value)) return setTextValue(value + "");

                        let inputValue: number = +textInputRef.current.value;
                        if (!(inputValue >= +parameter.min! && inputValue <= +parameter.max!)) return setTextValue(value + "");

                        inputValue = round(inputValue);

                        setValue(inputValue)
                        setTextValue(inputValue + "")
                        handleChange(inputValue)
                    }, 500);
                }

                setElement(
                    <>
                        <ParameterLabelComponent sessionId={sessionId} parameterId={parameterId} />
                        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                            <Slider
                                style={{ width: "65%" }}
                                label={round(value)}
                                defaultValue={+parameter.value}
                                min={+parameter.min!}
                                max={+parameter.max!}
                                step={step}
                                value={value}
                                onChange={(v) => {
                                    setValue(v);
                                    setTextValue(round(v) + "")
                                }}
                                onChangeEnd={handleChange}
                            />
                            <TextInput
                                ref={textInputRef}
                                style={{ width: "30%" }}
                                value={textValue}
                                onChange={handleDirectChange}
                            />
                        </div>
                    </>
                )
            }
        })

        return () => { }
    }, [sessionId, parameterId, loading, value, textValue]);

    return (
        <>
            {loading && <Skeleton height={8} mt={6} radius="xl" />}
            {!loading && element}
        </>
    );
}