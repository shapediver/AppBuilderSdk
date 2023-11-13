import { ActionIcon, ColorInput } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import React, { useEffect } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { useParameterComponentCommons } from "hooks/useParameterComponentCommons";

function convertFromSdColor(val: string) {
	return val.replace("0x", "#").substring(0, 7);
}

/**
 * Functional component that creates a color swatch for a color parameter.
 *
 * @returns
 */
export default function ParameterColorComponent(props: PropsParameter) {

	const {
		definition,
		value,
		setValue,
		handleChange,
		onCancel,
		disabled
	} = useParameterComponentCommons<string>(props, 0, state => state.uiValue);

	const defaultValue = convertFromSdColor(definition.defval);

	useEffect(() => setValue(defaultValue), [defaultValue]);

	return <>
		<ParameterLabelComponent { ...props } cancel={onCancel} />
		{ definition && <ColorInput
			styles={() => ({
				input: { cursor: "pointer" }
				// track: { cursor: "pointer" },
			})}
			placeholder="Pick color"
			value={value}
			onChange={setValue}
			rightSection={
				<ActionIcon onClick={() => handleChange(defaultValue)}>
					<IconRefresh size={16} />
				</ActionIcon>
			}
			onChangeEnd={handleChange}
			readOnly={disabled}
		/> }
	</>;
}
