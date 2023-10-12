import { ActionIcon, FileInput } from "@mantine/core";
import { IconUpload, IconX } from "@tabler/icons-react";
import React, { JSX } from "react";
import { extendMimeTypes, mapMimeTypeToFileEndings } from "@shapediver/viewer.utils.mime-type";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { useParameter } from "hooks/useParameter";

/**
 * Functional component that creates a file input for a file parameter.
 *
 * @returns
 */
export default function ParameterFileInputComponent(props: PropsParameter): JSX.Element {
	const { sessionId, parameterId, disableIfDirty } = props;
	const { definition, actions, state } = useParameter<File|null>(sessionId, parameterId);
	
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
