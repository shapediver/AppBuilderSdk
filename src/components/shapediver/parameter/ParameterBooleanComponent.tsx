import { Switch } from "@mantine/core";
import React, { JSX, useState } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { ISdReactParameter } from "types/shapediver/parameter";
import { useShapediverStoreParameters } from "store/parameterStore";

/**
 * Functional component that creates a button for a boolean parameter.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterBooleanComponent(props: PropsParameter): JSX.Element {
	const { sessionId, parameterId } = props;
	const parametersStore = useShapediverStoreParameters();
	const { definition, actions } = parametersStore.useParameter(sessionId, parameterId)(state => state as ISdReactParameter<boolean>);
	
	const [defaultValue] = useState(() => definition.defval.toLowerCase() === "true");

	const handleChange = (value: boolean) => {
		// set the value and customize the session
		if (actions.setUiValue(value)) {
			actions.execute();
		}
	};

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
