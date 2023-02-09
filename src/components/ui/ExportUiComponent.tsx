import '../../ViewportComponent.css';
import { useEffect, useRef, useState } from "react";
import { useShapeDiverViewerStore } from '../../app/shapediver/viewerStore';
import { Loader } from '@mantine/core';
import ExportButtonComponent from './exports/ExportButtonComponent';

interface Props {
    id: string
}

export default function ExportUiComponent({ id }: Props): JSX.Element {
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
                        for (let e in session.exports) {
                            const exp = session.exports[e];

                            if (exp.hidden) continue;
                            elements.push(<div key={exp.id}><ExportButtonComponent sessionId={id} exportId={e} /></div>);
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
