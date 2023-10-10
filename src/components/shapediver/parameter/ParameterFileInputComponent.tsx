import { ActionIcon, FileInput } from "@mantine/core";
import { IconUpload, IconX } from "@tabler/icons-react";
import React, { JSX } from "react";
import { extendMimeTypes, mapMimeTypeToFileEndings } from "@shapediver/viewer.utils.mime-type";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { ISdReactParameter } from "types/shapediver/parameter";
import { useShapediverStoreParameters } from "store/parameterStore";

/**
 * Functional component that creates a file input for a file parameter.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterFileInputComponent(props: PropsParameter): JSX.Element {
	const { sessionId, parameterId } = props;
	const parametersStore = useShapediverStoreParameters();
	const { definition, actions } = parametersStore.useParameter(sessionId, parameterId)(state => state as ISdReactParameter<File|null>);
	
	// callback for when the value was changed
	const handleChange = (value: File | null) => {
		if (actions.setUiValue(value || "")) {
			actions.execute();
		}
	};
	// create the file endings from all the formats that are specified in the parameter
	const fileEndings = [...mapMimeTypeToFileEndings(extendMimeTypes(definition.format!))];

	return <>
		<ParameterLabelComponent { ...props } />
		{ definition && <FileInput
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
		/> }
	</>;
}
