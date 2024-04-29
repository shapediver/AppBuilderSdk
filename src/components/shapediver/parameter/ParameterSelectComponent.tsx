import { MultiSelect, Select } from "@mantine/core";
import React from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { useParameterComponentCommons } from "hooks/shapediver/parameters/useParameterComponentCommons";
import { ShapeDiverResponseParameterVisualization } from "@shapediver/api.geometry-api-dto-v2";

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

	const inputComponent = definition.visualization === ShapeDiverResponseParameterVisualization.CHECKLIST
		? <MultiSelect
			value={value ? value.split(",").map((v) => definition.choices![parseInt(v)]) : []}
			onChange={(v) => {
				handleChange(definition.choices ?
					definition.choices
						// Collect indexes and values
						.map((value, index) => ({ index, value }))
						// Filter by values
						.filter((obj) => v.includes(obj.value))
						// Return filtered indexes
						.map((obj) => obj.index)
						.join(",")
					: ""
				);
			}}
			data={definition.choices!}
			disabled={disabled}
			comboboxProps={{withinPortal: false}}
		/>
		: <Select
			allowDeselect={false}
			value={definition.choices![+value]}
			onChange={(v) => handleChange(definition.choices!.indexOf(v!) + "")}
			data={definition.choices!}
			disabled={disabled}
			comboboxProps={{withinPortal: false}}
		/>;

	return <>
		<ParameterLabelComponent { ...props } cancel={onCancel} />
		{ definition && inputComponent}
	</>;
}
