import { Switch } from "@mantine/core";
import React, { JSX, useState } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { IShapeDiverParameter } from "types/shapediver/parameter";
import { useShapeDiverStoreParameters } from "store/shapediverStoreParameters";

/**
 * Functional component that creates a button for a boolean parameter.
 *
 * @returns
 */
export default function ParameterBooleanComponent(props: PropsParameter): JSX.Element {
	const { sessionId, parameterId, disableIfDirty } = props;
	const parametersStore = useShapeDiverStoreParameters();
	const { definition, actions, state } = parametersStore.useParameter(sessionId, parameterId)(state => state as IShapeDiverParameter<boolean>);
	
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
			disabled={disableIfDirty && state.dirty}
		/>}
	</>;
}
