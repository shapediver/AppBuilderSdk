import { ActionIcon, ColorInput } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import React, { JSX, useState } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { IShapeDiverParameter } from "types/shapediver/parameter";
import { useShapeDiverStoreParameters } from "store/shapediverStoreParameters";

/**
 * Functional component that creates a color swatch for a color parameter.
 *
 * @returns
 */
export default function ParameterColorComponent(props: PropsParameter): JSX.Element {
	const { sessionId, parameterId, disableIfDirty } = props;
	const parametersStore = useShapeDiverStoreParameters();
	const { definition, actions, state } = parametersStore.useParameter(sessionId, parameterId)(state => state as IShapeDiverParameter<string>);
	
	const defaultValue = definition.defval.replace("0x", "#").substring(0, 7);
	const [value, setValue] = useState(() => defaultValue);

	// callback for when the value was changed
	const handleChange = (colorValue: string) => {
		if (actions.setUiValue(colorValue)) {
			actions.execute();
		}
	};

	return <>
		<ParameterLabelComponent { ...props } />
		{ definition && <ColorInput
			styles={() => ({
				input: { cursor: "pointer" }
				// track: { cursor: "pointer" },
			})}
			placeholder="Pick color"
			value={value}
			onChange={setValue}
			rightSection={
				<ActionIcon onClick={() => {
					setValue(defaultValue);
					handleChange(defaultValue);
				}}>
					<IconRefresh size={16} />
				</ActionIcon>
			}
			onChangeEnd={handleChange}
			disabled={disableIfDirty && state.dirty}
		/> }
	</>;
}
