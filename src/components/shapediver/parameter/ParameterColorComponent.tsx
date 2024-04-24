import { ActionIcon, ColorInput } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import React, { useCallback } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { useParameterComponentCommons } from "hooks/shapediver/parameters/useParameterComponentCommons";

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
		handleChange,
		value,
		onCancel,
		disabled
	} = useParameterComponentCommons<string>(props, 0, state => state.uiValue);

	const handleSdColorChange = useCallback((val: string) => {
		handleChange(val.replace("#", "0x") + "ff");
	}, [handleChange]);

	return <>
		<ParameterLabelComponent { ...props } cancel={onCancel} />
		{ definition && <ColorInput
			placeholder="Pick color"
			value={convertFromSdColor(value)}
			rightSection={
				<ActionIcon onClick={() => handleChange(definition.defval)}>
					<IconRefresh size={16} />
				</ActionIcon>
			}
			onChangeEnd={handleSdColorChange}
			disabled={disabled}
			popoverProps={{withinPortal: false}}
		/> }
	</>;
}
