import { Switch } from "@mantine/core";
import React, { JSX, useEffect, useState } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameters } from "types/components/shapediver/uiParameter";

/**
 * Functional component that creates a button for a boolean parameter.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterBooleanComponent(props: PropsParameters<boolean>): JSX.Element {
	const { parameter } = props;
	const [defaultValue, setDefaultValue] = useState(false);

	const handleChange = (value: boolean) => {
		// set the value and customize the session
		if (parameter.setUiValue(value)) {
			parameter.execute();
		}
	};

	useEffect(() => {
		setDefaultValue(parameter.state.uiValue === true || parameter.state.uiValue === "true");
	}, [parameter]);

	return <>
		<ParameterLabelComponent { ...props} />
		{parameter && <Switch
			styles={() => ({
				track: { cursor: "pointer" },
			})}
			size="md"
			defaultChecked={defaultValue}
			onChange={(event) => handleChange(event.currentTarget.checked)}
		/>}
	</>;
}
