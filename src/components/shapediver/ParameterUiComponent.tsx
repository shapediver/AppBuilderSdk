import { useEffect, useRef, useState } from "react";
import { useShapediverViewerStore } from '../../context/shapediverViewerStore';
import { PARAMETER_TYPE } from '@shapediver/viewer';
import { Accordion, Divider, Loader, MediaQuery, ScrollArea, useMantineTheme } from '@mantine/core';
import ParameterSliderComponent from './parameter/ParameterSliderComponent';
import ParameterBooleanComponent from './parameter/ParameterBooleanComponent';
import ParameterStringComponent from './parameter/ParameterStringComponent';
import ParameterColorComponent from './parameter/ParameterColorComponent';
import ParameterSelectComponent from './parameter/ParameterSelectComponent';
import ParameterLabelComponent from './parameter/ParameterLabelComponent';
import ParameterFileInputComponent from './parameter/ParameterFileInputComponent';

interface Props {
    sessionId: string
}

export default function ParameterUiComponent({ sessionId }: Props): JSX.Element {
    const theme = useMantineTheme();
    const activeSessionsRef = useRef(useShapediverViewerStore.getState().activeSessions)
    const [loading, setLoading] = useState(true);
    const [element, setElement] = useState(<></>);

    useEffect(() => {
        const createParameterUi = () => {
            const activeSessions = activeSessionsRef.current;
            const activeSession = activeSessions[sessionId] || Promise.resolve();
            setLoading(true);

            (activeSession || Promise.resolve()).then((session) => {
                if (session) {
                    setLoading(false);

                    let elementGroups: {
                        [key: string]: {
                            group: { id: string, name: string }
                            elements: JSX.Element[],
                        }
                    } = {};

                    const parameters = Object.values(session.parameters);
                    parameters.sort((a, b) => (a.order || Infinity) - (b.order || Infinity));

                    for (let i = 0; i < parameters.length; i++) {
                        const param = parameters[i];
                        if (param.hidden) continue;

                        const group = param.group || { id: "default", name: "Parameter Group" };
                        if (!elementGroups[group.id]) {
                            elementGroups[group.id] = {
                                group,
                                elements: []
                            }
                        }

                        if (
                            param.type === PARAMETER_TYPE.INT ||
                            param.type === PARAMETER_TYPE.FLOAT ||
                            param.type === PARAMETER_TYPE.EVEN ||
                            param.type === PARAMETER_TYPE.ODD
                        ) {
                            elementGroups[group.id].elements.push(<div key={param.id}><ParameterSliderComponent sessionId={sessionId} parameterId={param.id} /></div>);
                        } else if (param.type === PARAMETER_TYPE.BOOL) {
                            elementGroups[group.id].elements.push(<div key={param.id}><ParameterBooleanComponent sessionId={sessionId} parameterId={param.id} /></div>);
                        } else if (param.type === PARAMETER_TYPE.STRING) {
                            elementGroups[group.id].elements.push(<div key={param.id}><ParameterStringComponent sessionId={sessionId} parameterId={param.id} /></div>);
                        } else if (param.type === PARAMETER_TYPE.STRINGLIST) {
                            elementGroups[group.id].elements.push(<div key={param.id}><ParameterSelectComponent sessionId={sessionId} parameterId={param.id} /></div>);
                        } else if (param.type === PARAMETER_TYPE.COLOR) {
                            elementGroups[group.id].elements.push(<div key={param.id}><ParameterColorComponent sessionId={sessionId} parameterId={param.id} /></div>);
                        } else if (param.type === PARAMETER_TYPE.FILE) {
                            elementGroups[group.id].elements.push(<div key={param.id}><ParameterFileInputComponent sessionId={sessionId} parameterId={param.id} /></div>);
                        } else {
                            elementGroups[group.id].elements.push(<div key={param.id}><ParameterLabelComponent sessionId={sessionId} parameterId={param.id} /></div>);
                        }
                    }

                    let elements: JSX.Element[] = [];

                    for (let e in elementGroups) {
                        const g = elementGroups[e];

                        let groupElements: JSX.Element[] = [];
                        g.elements.forEach((element, index) => {
                            groupElements.push(element);
                            if(index !== g.elements.length-1) groupElements.push(<Divider key={element.key+"_divider"} my="sm" />)
                        });

                        elements.push(
                            <Accordion.Item key={g.group.id} value={g.group.id}>
                                <Accordion.Control>{g.group.name}</Accordion.Control>
                                <Accordion.Panel
                                    key={g.group.id}
                                    style={{ background: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0] }}
                                >
                                    {groupElements}
                                </Accordion.Panel>
                            </Accordion.Item>
                        )

                    }

                    setElement(
                        <MediaQuery smallerThan="sm" styles={{
                            // minus tab height (34) and two times margin (2 x 10)
                            height: "calc(300px - 54px)"
                        }}>
                            <ScrollArea type="auto">
                                <Accordion variant="contained" radius="md">
                                    {elements}
                                </Accordion>
                            </ScrollArea>
                        </MediaQuery>
                    )
                }
            })
        }

        const unsubscribe = useShapediverViewerStore.subscribe(state => {
            activeSessionsRef.current = state.activeSessions;
            createParameterUi();
        });

        createParameterUi();

        return () => {
            unsubscribe()
        }
    }, [sessionId, theme]);

    return (
        <>
            {loading && <Loader style={{ width: "100%" }} mt="xl" size="xl" variant="dots" />}
            {!loading && element}
        </>
    )
};
