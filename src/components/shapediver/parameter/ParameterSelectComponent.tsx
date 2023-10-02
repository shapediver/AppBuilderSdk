import { Select } from "@mantine/core";
import React, { JSX } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameters } from "types/components/shapediver/uiParameter";

/**
 * Functional component that creates a dropdown select component for a string list parameter.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterSelectComponent(props: PropsParameters<any>): JSX.Element {
	const { parameter } = props;

	// callback for when the value was changed
	const handleChange = (value: string) => {
		if (parameter.setUiValue(parameter.definition.choices!.indexOf(value) + "")) {
			parameter.execute();
		}
	};

	return <>
		<ParameterLabelComponent { ...props } />
		{ parameter && <Select
			placeholder="Pick one"
			dropdownPosition="bottom"
			defaultValue={parameter.definition.choices![+parameter.definition.defval]}
			onChange={handleChange}
			data={parameter.definition.choices!}
		/>}
	</>;
}
