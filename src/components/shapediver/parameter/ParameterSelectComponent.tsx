import { Select } from "@mantine/core";
import React, { JSX } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { useShapeDiverStoreParameters } from "store/shapediverStoreParameters";
import { IShapeDiverParameter } from "types/shapediver/parameter";

/**
 * Functional component that creates a dropdown select component for a string list parameter.
 *
 * @returns
 */
export default function ParameterSelectComponent(props: PropsParameter): JSX.Element {
	const { sessionId, parameterId, disableIfDirty } = props;
	const parametersStore = useShapeDiverStoreParameters();
	const { definition, actions, state } = parametersStore.useParameter(sessionId, parameterId)(state => state as IShapeDiverParameter<any>);
	
	// callback for when the value was changed
	const handleChange = (value: string) => {
		if (actions.setUiValue(definition.choices!.indexOf(value) + "")) {
			actions.execute();
		}
	};

	return <>
		<ParameterLabelComponent { ...props } />
		{ definition && <Select
			placeholder="Pick one"
			dropdownPosition="bottom"
			defaultValue={definition.choices![+definition.defval]}
			onChange={handleChange}
			data={definition.choices!}
			disabled={disableIfDirty && state.dirty}
		/>}
	</>;
}
