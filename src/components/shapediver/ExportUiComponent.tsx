import { useEffect, useRef, useState } from "react";
import { useShapediverViewerStore } from '../../context/shapediverViewerStore';
import { Divider, Loader, MediaQuery, ScrollArea } from '@mantine/core';
import ExportButtonComponent from './exports/ExportButtonComponent';

interface Props {
    sessionId: string
}

export default function ExportUiComponent({ sessionId }: Props): JSX.Element {
    const activeSessionsRef = useRef(useShapediverViewerStore.getState().activeSessions)
    const [loading, setLoading] = useState(true);
    const [element, setElement] = useState(<></>);

    useEffect(() => {
        const createExportUi = () => {
            const activeSessions = activeSessionsRef.current;
            const activeSession = activeSessions[sessionId] || Promise.resolve();

            setLoading(true);
            (activeSession || Promise.resolve()).then((session) => {
                if (session) {
                    setLoading(false);
                    
                    let elements: JSX.Element[] = [];
                    const exports = Object.values(session.exports);
                    for (let i = 0; i < exports.length; i++) {
                        const exp = exports[i];

                        if (exp.hidden) continue;
                        elements.push(<div key={exp.id}><ExportButtonComponent sessionId={sessionId} exportId={exp.id} /></div>);
                        if(i !== exports.length-1) elements.push(<Divider key={exp.id+"_divider"} my="sm" />)
                    }

                    setElement(
                        <MediaQuery smallerThan="sm" styles={{
                            // minus tab height (34) and two times margin (2 x 10)
                            height: "calc(300px - 54px)"
                        }}>
                            <ScrollArea>
                                {elements}
                            </ScrollArea>
                        </MediaQuery>
                    )
                }
            })
        }

        const unsubscribe = useShapediverViewerStore.subscribe(state => {
            activeSessionsRef.current = state.activeSessions;
            createExportUi();
        });

        createExportUi();

        return () => {
            unsubscribe()
        }
    }, [sessionId]);

    return (
        <>
            {loading && <Loader style={{ width: "100%" }} mt="xl" size="xl" variant="dots" />}
            {!loading && element}
        </>
    )
};
