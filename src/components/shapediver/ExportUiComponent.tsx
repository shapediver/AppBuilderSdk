import { useEffect, useRef, useState } from "react";
import { useShapediverViewerStore } from '../../context/shapediverViewerStore';
import { Loader, MediaQuery, ScrollArea } from '@mantine/core';
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

            (activeSession || Promise.resolve()).then((session) => {
                setLoading(false);

                if (session) {
                    let elements: JSX.Element[] = [];
                    for (let e in session.exports) {
                        const exp = session.exports[e];

                        if (exp.hidden) continue;
                        elements.push(<div key={exp.id}><ExportButtonComponent sessionId={sessionId} exportId={e} /></div>);
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
            {loading && <Loader size="xl" variant="dots" />}
            {!loading && element}
        </>
    )
};
