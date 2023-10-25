import { Switch } from "@mantine/core";
import React, { JSX, useEffect, useRef, useState } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { useParameter } from "hooks/useParameter";

/**
 * Functional component that creates a button for a boolean parameter.
 *
 * @returns
 */
export default function ParameterBooleanComponent(props: PropsParameter): JSX.Element {
	const { sessionId, parameterId, disableIfDirty } = props;
	const { definition, actions, state } = useParameter<boolean>(sessionId, parameterId);
	const [value, setValue] = useState(() => state.uiValue);

	const debounceTimeout = 0;
	const debounceRef = useRef<NodeJS.Timeout>();

	const handleChange = (curval : string | boolean, timeout? : number) => {
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

	return <>
		<ParameterLabelComponent { ...props} cancel={onCancel} />
		{definition && <Switch
			styles={() => ({
				track: { cursor: "pointer" },
			})}
			size="md"
			checked={value === true || value.toString().toLowerCase() === "true"}
			onChange={(e) => handleChange(e.currentTarget.checked)}
			disabled={disableIfDirty && state.dirty}
		/>}
	</>;
}
