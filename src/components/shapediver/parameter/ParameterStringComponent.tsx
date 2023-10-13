import { TextInput } from "@mantine/core";
import React, { JSX, useRef } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { useParameter } from "hooks/useParameter";

/**
 * Functional component that creates a string input component for a string parameter.
 *
 * @returns
 */
export default function ParameterStringComponent(props: PropsParameter): JSX.Element {
	const { sessionId, parameterId, disableIfDirty } = props;
	const { definition, actions, state } = useParameter<string>(sessionId, parameterId);
	const textInputRef = useRef<HTMLInputElement>(null);

	// function to apply the value to the parameter and customize the scene
	const handleChange = (value: string) => {
		// set the value and customize the session
		if (actions.setUiValue(value)) {
			actions.execute();
		}
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
		}, 1000);
	};

	return <>
		<ParameterLabelComponent { ...props } />
		{definition && <TextInput
			ref={textInputRef}
			defaultValue={state.uiValue}
			onChange={handleChangeDelay}
			disabled={disableIfDirty && state.dirty}
			maxLength={definition.max}
		/>}
	</>;
}
