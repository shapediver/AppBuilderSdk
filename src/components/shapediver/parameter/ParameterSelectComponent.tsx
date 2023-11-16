import { Select } from "@mantine/core";
import React from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { useParameterComponentCommons } from "hooks/useParameterComponentCommons";

/**
 * Functional component that creates a dropdown select component for a string list parameter.
 *
 * @returns
 */
export default function ParameterSelectComponent(props: PropsParameter) {

	const {
		definition,
		value,
		handleChange,
		onCancel,
		disabled
	} = useParameterComponentCommons<string>(props, 0);

	return <>
		<ParameterLabelComponent { ...props } cancel={onCancel} />
		{ definition && <Select
			allowDeselect={false}
			value={definition.choices![+value]}
			onChange={(v) => handleChange(definition.choices!.indexOf(v!) + "")}
			data={definition.choices!}
			disabled={disabled}
		/>}
	</>;
}
