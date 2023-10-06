import { Select } from "@mantine/core";
import React, { JSX } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameters } from "types/components/shapediver/propsParameter";

/**
 * Functional component that creates a dropdown select component for a string list parameter.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterSelectComponent(props: PropsParameters<any>): JSX.Element {
	const { definition, actions } = props;

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
		/>}
	</>;
}
