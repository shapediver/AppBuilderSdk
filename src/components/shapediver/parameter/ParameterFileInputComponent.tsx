import { ActionIcon, FileInput } from "@mantine/core";
import { IconUpload, IconX } from "@tabler/icons-react";
import React, { JSX, useEffect, useRef, useState } from "react";
import { extendMimeTypes, mapMimeTypeToFileEndings } from "@shapediver/viewer.utils.mime-type";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import ParameterComponentBase from "components/shapediver/parameter/ParameterComponentBase";
import { PropsParameters } from "types/components/shapediver/parameters";
import { useShapediverViewerStore } from "context/shapediverViewerStore";

/**
 * Functional component that creates a file input for a file parameter.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterFileInputComponent({ parameterId, sessionId }: PropsParameters): JSX.Element {
	const sessionParameters = useRef(useShapediverViewerStore(state => state.parameters[sessionId]));
	const changeParameterProperty = useShapediverViewerStore((state) => state.parameterPropertyChange);
	const [loading, setLoading] = useState(true);
	const [element, setElement] = useState(<></>);

	useEffect(() => {
		const parameter = sessionParameters.current ? sessionParameters.current[parameterId] : undefined;

		// early return if the parameter is not in the store (yet)
		if (!parameter) return;

		// deactivate the loading mode
		setLoading(false);

		// create the file endings from all the formats that are specified in the parameter
		const fileEndings = [...mapMimeTypeToFileEndings(extendMimeTypes(parameter.format!))];

		// callback for when the value was changed
		const handleChange = (value: File | null) => {
			if (!parameter) return;

			changeParameterProperty(sessionId, parameterId, "value", value || "");
		};

		// set the element with the label and a FileInput that triggers the handleChange-callback
		// a button is added to the right to remove the file
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
							handleChange(null);
						}}>
							<IconX size={16} />
						</ActionIcon>
					}
				/>
			</>
		);
	}, [sessionId, parameterId]);

	return (<ParameterComponentBase loading={loading} element={element} />);
}
