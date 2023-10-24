import { ActionIcon, ColorInput } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import React, { JSX, useEffect, useRef, useState } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { useParameter } from "hooks/useParameter";

function convertFromSdColor(val: string) {
	return val.replace("0x", "#").substring(0, 7);
}

/**
 * Functional component that creates a color swatch for a color parameter.
 *
 * @returns
 */
export default function ParameterColorComponent(props: PropsParameter): JSX.Element {
	const { sessionId, parameterId, disableIfDirty } = props;
	const { definition, actions, state } = useParameter<string>(sessionId, parameterId);
	const [value, setValue] = useState(() => convertFromSdColor(state.uiValue));

	const debounceTimeout = 0;
	const debounceRef = useRef<NodeJS.Timeout>();

	const handleChange = (curval : string, timeout? : number) => {
		clearTimeout(debounceRef.current);
		setValue(curval);
		debounceRef.current = setTimeout(() => {
			if (actions.setUiValue(curval)) {
				actions.execute();
			}
		}, timeout === undefined ? debounceTimeout : timeout);
	};

	useEffect(() => {
		setValue(state.uiValue);
	}, [state.uiValue]);

	const onCancel = state.dirty ? () => handleChange(state.execValue, 0) : undefined;

	const defaultValue = convertFromSdColor(definition.defval);

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
			readOnly={disableIfDirty && state.dirty}
		/> }
	</>;
}
