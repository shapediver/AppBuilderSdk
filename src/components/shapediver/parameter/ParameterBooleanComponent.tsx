import { Switch } from "@mantine/core";
import React, { JSX, useEffect, useState } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameters } from "types/components/shapediver/propsParameter";

/**
 * Functional component that creates a button for a boolean parameter.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterBooleanComponent(props: PropsParameters<boolean>): JSX.Element {
	const { definition, state, actions } = props;
	const [defaultValue, setDefaultValue] = useState(false);

	const handleChange = (value: boolean) => {
		// set the value and customize the session
		if (actions.setUiValue(value)) {
			actions.execute();
		}
	};

	useEffect(() => {
		setDefaultValue(state.uiValue === true || state.uiValue === "true");
	}, [state]);

	return <>
		<ParameterLabelComponent { ...props} />
		{definition && <Switch
			styles={() => ({
				track: { cursor: "pointer" },
			})}
			size="md"
			defaultChecked={defaultValue}
			onChange={(event) => handleChange(event.currentTarget.checked)}
		/>}
	</>;
}
