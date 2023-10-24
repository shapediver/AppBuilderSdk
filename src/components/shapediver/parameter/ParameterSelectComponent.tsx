import { Select } from "@mantine/core";
import React, { JSX } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { useParameter } from "hooks/useParameter";

/**
 * Functional component that creates a dropdown select component for a string list parameter.
 *
 * @returns
 */
export default function ParameterSelectComponent(props: PropsParameter): JSX.Element {
	const { sessionId, parameterId, disableIfDirty } = props;
	const { definition, actions, state } = useParameter<any>(sessionId, parameterId);
	
	// callback for when the value was changed
	const handleChange = (value: string | null) => {
		if (value && actions.setUiValue(definition.choices!.indexOf(value) + "")) {
			actions.execute();
		}
	};

	return <>
		<ParameterLabelComponent { ...props } />
		{ definition && <Select
			placeholder="Pick one"
			defaultValue={definition.choices![+definition.defval]}
			onChange={handleChange}
			data={definition.choices!}
			disabled={disableIfDirty && state.dirty}
		/>}
	</>;
}
