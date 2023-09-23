import { TextInput } from "@mantine/core";
import React, { JSX, useRef } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameters } from "types/components/shapediver/uiParameter";

/**
 * Functional component that creates a string input component for a string parameter.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterStringComponent(props: PropsParameters<string>): JSX.Element {
	const { parameter } = props;
	const textInputRef = useRef<HTMLInputElement>(null);

	// function to apply the value to the parameter and customize the scene
	const handleChange = (value: string) => {
		// set the value and customize the session
		parameter.setUiValue(value);
	};

	let zoomResizeTimeout: NodeJS.Timeout;
	// callback for when the text value has been changed
	// instead of applying the value directly, set a timeout to wait on further input
	// if this input does not happen within 500ms, execute the handleChange-callback
	const handleChangeDelay = () => {
		clearTimeout(zoomResizeTimeout);
		zoomResizeTimeout = setTimeout(() => {
			if (textInputRef.current)
				handleChange(textInputRef.current.value);
		}, 500);
	};

	return <>
		<ParameterLabelComponent { ...props } />
		{parameter && <TextInput
			ref={textInputRef}
			style={{
				flexGrow: 0.9
			}}
			defaultValue={parameter.state.uiValue}
			onChange={handleChangeDelay}
		/>}
	</>;
}
