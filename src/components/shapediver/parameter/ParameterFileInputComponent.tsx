import { FileInput } from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";
import React, { JSX, useEffect, useRef, useState } from "react";
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
	const { definition, actions, state } = useParameter<File|string>(sessionId, parameterId);
	const [ value, setValue ] = useState<File|string>(""); // TODO implement case if default value of File parameter is a string
	
	const debounceTimeout = 0;
	const debounceRef = useRef<NodeJS.Timeout>();

	const handleChange = (curval : File|string, timeout? : number) => {
		console.log(curval);
		clearTimeout(debounceRef.current);
		setValue(curval);
		debounceRef.current = setTimeout(() => {
			if (actions.setUiValue(curval)) {
				actions.execute();
			}
		}, timeout === undefined ? debounceTimeout : timeout);
	};

	useEffect(() => {
		setValue(state.uiValue);
	}, [state.uiValue]);

	const onCancel = state.dirty ? () => handleChange(state.execValue, 0) : undefined;

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
			disabled={disableIfDirty && state.dirty}
			value={typeof(value) === "string" ? null : value}
		/> }
	</>;
}
