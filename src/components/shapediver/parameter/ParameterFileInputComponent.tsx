import { ActionIcon, FileInput, Skeleton } from "@mantine/core";
import { IconUpload, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useShapediverViewerStore } from "../../../context/shapediverViewerStore";
import { mapMimeTypeToFileEndings, extendMimeTypes } from "@shapediver/viewer.utils.mime-type";
import ParameterLabelComponent from "./ParameterLabelComponent";

interface Props {
    sessionId: string,
    parameterId: string
}

export default function ParameterFileInputComponent({ sessionId, parameterId }: Props): JSX.Element {
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
                const fileEndings = [...mapMimeTypeToFileEndings(extendMimeTypes(parameter.format!))];

                const handleChange = (value: File | null) => {
                    activeSessions[sessionId].then((session) => {
                        if (session) {
                            parameter.value = value || "";
                            session.customize();
                        }
                    })
                }

                setElement(
                    <>
                        <ParameterLabelComponent sessionId={sessionId} parameterId={parameterId} />
                        <FileInput
                            placeholder="File Upload"
                            accept={fileEndings.join(",")}
                            onChange={handleChange}
                            icon={<IconUpload size={14} />}
                            rightSection={
                                <ActionIcon onClick={() => {
                                        handleChange(null)
                                    }}>
                                    <IconX size={16} />
                                </ActionIcon>
                            }
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