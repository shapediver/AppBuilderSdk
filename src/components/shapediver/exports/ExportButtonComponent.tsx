import { Button, Loader, Skeleton } from "@mantine/core";
import { EXPORT_TYPE } from "@shapediver/viewer";
import { IconDownload, IconMailForward } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useShapediverViewerStore } from "../../../context/shapediverViewerStore";
import ExportLabelComponent from "./ExportLabelComponent";

interface Props {
    sessionId: string,
    exportId: string
}


export const downloadBlobFile = (blob: Blob, filename: string) => {
    const modelFile = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = modelFile;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
};

export const fetchFileWithToken = (url: string, filename: string, finallyCb = () => { }) => {
    return fetch(url, {
        ...({}),
    })
        .then((res) => res.blob())
        .then((blob) => {
            downloadBlobFile(blob, filename);
        }).catch((err) => {
            throw new Error(err.message);
        })
        .finally(() => {
            finallyCb();
        });
};

export default function ExportButtonComponent({ sessionId, exportId }: Props): JSX.Element {
    const activeSessionsRef = useRef(useShapediverViewerStore(state => state.activeSessions));
    const [loading, setLoading] = useState(true);
    const [element, setElement] = useState(<></>);
    const [requestingExport, setRequestingExport] = useState(false);

    useEffect(() => {
        const activeSessions = activeSessionsRef.current;
        const activeSession = activeSessions[sessionId] || Promise.resolve();

        activeSession.then((session) => {
            setLoading(false);

            if (session) {
                const exp = session.exports[exportId];
                const leftIcon = exp.type === EXPORT_TYPE.DOWNLOAD ? <IconDownload /> : <IconMailForward />;

                const handleChange = () => {
                    activeSessions[sessionId].then((session) => {
                        if (session) {
                            setRequestingExport(true);
                            exp.request().then(async response => {
                                setRequestingExport(false);
                                if (exp.type === EXPORT_TYPE.DOWNLOAD) {
                                    if (
                                        response.content &&
                                        response.content[0] &&
                                        response.content[0].href
                                    ) {
                                        await fetchFileWithToken(response.content[0].href, `${response.filename}.${response.content[0].format}`)
                                    }
                                }
                            });
                        }
                    })
                }

                setElement(
                    <>
                        <ExportLabelComponent sessionId={sessionId} exportId={exportId} />

                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                        }}>
                            <Button
                                style={{
                                    width: "70%"
                                }}
                                fullWidth={true}
                                leftIcon={leftIcon}
                                variant="default"
                                onClick={handleChange}
                            >
                                {exp.type === EXPORT_TYPE.DOWNLOAD ? "Download File" : "Send Email"}
                            </Button>
                            {requestingExport && <Loader />}
                        </div>
                    </>
                )
            }
        })

        return () => { }
    }, [sessionId, exportId, requestingExport]);

    return (
        <>
            {loading && <Skeleton height={8} mt={6} radius="xl" />}
            {!loading && element}
        </>
    );
}