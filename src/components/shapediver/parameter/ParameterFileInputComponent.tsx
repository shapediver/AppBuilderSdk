import { FileInput } from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";
import React, { useEffect } from "react";
import { extendMimeTypes, mapMimeTypeToFileEndings } from "@shapediver/viewer.utils.mime-type";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { useParameterComponentCommons } from "hooks/shapediver/parameters/useParameterComponentCommons";
import { isFileParameter } from "types/shapediver/viewer";
import { guessMissingMimeType } from "utils/file";

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
	} = useParameterComponentCommons<File>(props, 0);

	// create the file endings from all the formats that are specified in the parameter
	const fileEndings = [...mapMimeTypeToFileEndings(extendMimeTypes(definition.format!))];

	// create a pseudo file in case the value is a file id and a filename for it exists
	const [ defaultFile, setDefaultFile ] = React.useState<File | null>(null);
	useEffect(() => {
		if (typeof(value) === "string" && value.length > 0 && isFileParameter(definition)) {
			definition.getFilename(value)
				.then(filename => setDefaultFile(new File([], filename ?? "(Filename unknown)")))
				.catch(error => console.error(`Error getting filename for file with id ${value}`, error));
		}
		else {
			setDefaultFile(null);
		}
	}, [value]);
	
	return <>
		<ParameterLabelComponent { ...props } cancel={onCancel} />
		{ definition && <FileInput
			placeholder="File Upload"
			accept={fileEndings.join(",")}
			clearable={!!state.execValue}
			onChange={v => handleChange(guessMissingMimeType(v || ""))}
			leftSection={<IconUpload size={14} />}
			disabled={disabled}
			value={typeof(value) === "string" ? (value === definition.defval ? defaultFile : null) : value}
		/> }
	</>;
}
