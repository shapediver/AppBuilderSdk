import '../../ViewportComponent.css';
import { useEffect, useRef, useState } from "react";
import { useShapeDiverViewerStore } from '../../app/shapediver/viewerStore';
import { PARAMETER_TYPE } from '@shapediver/viewer';
import { Loader } from '@mantine/core';
import ParameterSliderComponent from './parameter/ParameterSliderComponent';
import ParameterBooleanComponent from './parameter/ParameterBooleanComponent';
import ParameterStringComponent from './parameter/ParameterStringComponent';
import ParameterColorComponent from './parameter/ParameterColorComponent';
import ParameterSelectComponent from './parameter/ParameterSelectComponent';
import ParameterLabelComponent from './parameter/ParameterLabelComponent';
import ParameterFileInputComponent from './parameter/ParameterFileInputComponent';

interface Props {
    id: string
}

export default function ParameterUiComponent({ id }: Props): JSX.Element {
    const activeSessionsRef = useRef(useShapeDiverViewerStore.getState().activeSessions)
    const [loading, setLoading] = useState(true);
    const [element, setElement] = useState(<></>);

    useEffect(() => {
        const unsubscribe = useShapeDiverViewerStore.subscribe(
            state => {
                activeSessionsRef.current = state.activeSessions;

                const activeSessions = activeSessionsRef.current;
                const activeSession = activeSessions[id] || Promise.resolve();

                (activeSession || Promise.resolve()).then((session) => {
                    setLoading(false);

                    if (session) {
                        let elements: JSX.Element[] = [];
                        for (let p in session.parameters) {
                            const param = session.parameters[p];

                            if (param.hidden) continue;

                            if (
                                param.type === PARAMETER_TYPE.INT ||
                                param.type === PARAMETER_TYPE.FLOAT ||
                                param.type === PARAMETER_TYPE.EVEN ||
                                param.type === PARAMETER_TYPE.ODD
                            ) {
                                elements.push(<div key={param.id}><ParameterSliderComponent sessionId={id} parameterId={p} /></div>);
                            } else if (param.type === PARAMETER_TYPE.BOOL) {
                                elements.push(<div key={param.id}><ParameterBooleanComponent sessionId={id} parameterId={p} /></div>);
                            } else if (param.type === PARAMETER_TYPE.STRING) {
                                elements.push(<div key={param.id}><ParameterStringComponent sessionId={id} parameterId={p} /></div>);
                            } else if (param.type === PARAMETER_TYPE.STRINGLIST) {
                                elements.push(<div key={param.id}><ParameterSelectComponent sessionId={id} parameterId={p} /></div>);
                            } else if (param.type === PARAMETER_TYPE.COLOR) {
                                elements.push(<div key={param.id}><ParameterColorComponent sessionId={id} parameterId={p} /></div>);
                            } else if (param.type === PARAMETER_TYPE.FILE) {
                                elements.push(<div key={param.id}><ParameterFileInputComponent sessionId={id} parameterId={p} /></div>);
                            } else {
                                console.log(param.type)
                                elements.push(<div key={param.id}><ParameterLabelComponent sessionId={id} parameterId={p} /></div>);
                            }
                        }

                        setElement(
                            <>
                                {elements}
                            </>
                        )
                    }
                })

            }
        );

        return () => {
            unsubscribe()
        }
    }, [id]);

    return (
        <>
            {loading && <Loader size="xl" variant="dots" />}
            {!loading && element}
        </>
    )
};
