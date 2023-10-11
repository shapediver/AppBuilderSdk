import { ActionIcon, FileInput } from "@mantine/core";
import { IconUpload, IconX } from "@tabler/icons-react";
import React, { JSX } from "react";
import { extendMimeTypes, mapMimeTypeToFileEndings } from "@shapediver/viewer.utils.mime-type";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { IShapeDiverParameter } from "types/shapediver/parameter";
import { useShapeDiverStoreParameters } from "store/shapediverStoreParameters";

/**
 * Functional component that creates a file input for a file parameter.
 *
 * @returns
 */
export default function ParameterFileInputComponent(props: PropsParameter): JSX.Element {
	const { sessionId, parameterId, disableIfDirty } = props;
	const parametersStore = useShapeDiverStoreParameters();
	const { definition, actions, state } = parametersStore.useParameter(sessionId, parameterId)(state => state as IShapeDiverParameter<File|null>);
	
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
			disabled={disableIfDirty && state.dirty}
		/> }
	</>;
}
