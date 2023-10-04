import { ActionIcon, ColorInput } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import React, { JSX, useEffect, useState } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameters } from "types/components/shapediver/uiParameter";

/**
 * Functional component that creates a color swatch for a color parameter.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterColorComponent(props: PropsParameters<string>): JSX.Element {
	const { parameter } = props;
	let defaultValue = "";
	const [value, setValue] = useState("");

	// callback for when the value was changed
	const handleChange = (colorValue: string) => {
		if (parameter.setUiValue(colorValue)) {
			parameter.execute();
		}
	};

	// TODO SS-7076 no need for an effect here, let's refactor this without effect - deprecated
	// TODO SS-7076 Reactive value required for inputs and can't be placed at the root scope
	useEffect(() => {
		// set the default value
		if (!defaultValue) {
			defaultValue = (parameter.definition.defval).replace("0x", "#").substring(0, 7);
			setValue(defaultValue);
		}
	}, [parameter]);

	return <>
		<ParameterLabelComponent { ...props } />
		{ parameter && <ColorInput
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
