import { Select } from "@mantine/core";
import React, { JSX, useEffect, useRef, useState } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { useParameter } from "hooks/useParameter";

/**
 * Functional component that creates a dropdown select component for a string list parameter.
 *
 * @returns
 */
export default function ParameterSelectComponent(props: PropsParameter): JSX.Element {
	const { sessionId, parameterId, disableIfDirty } = props;
	const { definition, actions, state } = useParameter<string>(sessionId, parameterId);
	const [value, setValue] = useState(() => state.uiValue);

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

	return <>
		<ParameterLabelComponent { ...props } cancel={onCancel} />
		{ definition && <Select
			allowDeselect={false}
			value={definition.choices![+value]}
			onChange={(v) => handleChange(definition.choices!.indexOf(v!) + "")}
			data={definition.choices!}
			disabled={disableIfDirty && state.dirty}
		/>}
	</>;
}
