import { Switch } from "@mantine/core";
import React from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { useParameterComponentCommons } from "hooks/shapediver/parameters/useParameterComponentCommons";

/**
 * Functional component that creates a button for a boolean parameter.
 *
 * @returns
 */
export default function ParameterBooleanComponent(props: PropsParameter) {

	const {
		definition,
		value,
		handleChange,
		onCancel,
		disabled
	} = useParameterComponentCommons<boolean>(props, 0);

	return <>
		<ParameterLabelComponent { ...props} cancel={onCancel} />
		{definition && <Switch
			checked={value === true || value.toString().toLowerCase() === "true"}
			onChange={(e) => handleChange(e.currentTarget.checked)}
			disabled={disabled}
		/>}
	</>;
}
