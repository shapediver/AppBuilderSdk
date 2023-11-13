import { FileInput } from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";
import React from "react";
import { extendMimeTypes, mapMimeTypeToFileEndings } from "@shapediver/viewer.utils.mime-type";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { useParameterComponentCommons } from "hooks/useParameterComponentCommons";

/**
 * Functional component that creates a file input for a file parameter.
 *
 * @returns
 */
export default function ParameterFileInputComponent(props: PropsParameter) {

	const {
		definition,
		value,
		state,
		handleChange,
		onCancel,
		disabled
	} = useParameterComponentCommons<File>(props, 0, () => "" /* TODO implement case if default value of File parameter is a string */);

	// create the file endings from all the formats that are specified in the parameter
	const fileEndings = [...mapMimeTypeToFileEndings(extendMimeTypes(definition.format!))];

	return <>
		<ParameterLabelComponent { ...props } cancel={onCancel} />
		{ definition && <FileInput
			placeholder="File Upload"
			accept={fileEndings.join(",")}
			clearable={!!state.execValue}
			onChange={v => handleChange(v || "")}
			leftSection={<IconUpload size={14} />}
			disabled={disabled}
			value={typeof(value) === "string" ? null : value}
		/> }
	</>;
}
