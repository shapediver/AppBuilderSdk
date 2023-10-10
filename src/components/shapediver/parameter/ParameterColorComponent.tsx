import { ActionIcon, ColorInput } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import React, { JSX, useEffect, useState } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameters } from "types/components/shapediver/propsParameter";

/**
 * Functional component that creates a color swatch for a color parameter.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterColorComponent(props: PropsParameters<string>): JSX.Element {
	const { definition, actions } = props;
	let defaultValue = "";
	const [value, setValue] = useState("");

	// callback for when the value was changed
	const handleChange = (colorValue: string) => {
		if (actions.setUiValue(colorValue)) {
			actions.execute();
		}
	};

	useEffect(() => {
		// set the default value
		if (!defaultValue) {
			defaultValue = (definition.defval).replace("0x", "#").substring(0, 7);
			setValue(defaultValue);
		}
	}, [definition]);

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
		/> }
	</>;
}
