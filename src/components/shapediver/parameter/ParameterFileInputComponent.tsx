import { ActionIcon, FileInput } from "@mantine/core";
import { IconUpload, IconX } from "@tabler/icons-react";
import React, { JSX } from "react";
import { extendMimeTypes, mapMimeTypeToFileEndings } from "@shapediver/viewer.utils.mime-type";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameters } from "types/components/shapediver/uiParameter";

/**
 * Functional component that creates a file input for a file parameter.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterFileInputComponent(props: PropsParameters<File|null>): JSX.Element {
	const { parameter } = props;
	// callback for when the value was changed
	const handleChange = (value: File | null) => {
		if (parameter.setUiValue(value || "")) {
			parameter.execute();
		}
	};
	// create the file endings from all the formats that are specified in the parameter
	const fileEndings = [...mapMimeTypeToFileEndings(extendMimeTypes(parameter.definition.format!))];

	return <>
		<ParameterLabelComponent { ...props } />
		{ parameter && <FileInput
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
