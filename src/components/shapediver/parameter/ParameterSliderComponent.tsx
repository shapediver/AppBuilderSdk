import { NumberInput, Slider, Tooltip } from "@mantine/core";
import { PARAMETER_TYPE } from "@shapediver/viewer";
import React, { JSX, useEffect, useRef, useState } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { IShapeDiverParameterDefinition } from "types/shapediver/parameter";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { useParameter } from "hooks/useParameter";

/**
 * Round the number depending on the parameter type.
 *
 * @param parameter
 * @param n
 * @returns
 */
const round = (parameter: IShapeDiverParameterDefinition, n: number) => {
	if (parameter.type === PARAMETER_TYPE.INT || parameter.type === PARAMETER_TYPE.EVEN || parameter.type === PARAMETER_TYPE.ODD)
		n = +n.toFixed(0);
	n = +n.toFixed(parameter.decimalplaces);

	return n;
};

/**
 * Functional component that creates a slider component for a number parameter. 
 * Additionally, a text input is added on the side. 
 *
 * @returns
 */
export default function ParameterSliderComponent(props: PropsParameter): JSX.Element {
	const { sessionId, parameterId, disableIfDirty, acceptRejectMode } = props;
	const { definition, actions, state } = useParameter<number>(sessionId, parameterId);
	const [value, setValue] = useState(() => state.uiValue);

	const debounceTimeout = acceptRejectMode ? 0 : 1000;
	const debounceRef = useRef<NodeJS.Timeout>();

	const handleChange = (curval : string | number, timeout? : number) => {
		clearTimeout(debounceRef.current);
		setValue(curval);
		debounceRef.current = setTimeout(() => {
			if (actions.setUiValue(curval)) {
				actions.execute(!acceptRejectMode);
			}
		}, timeout === undefined ? debounceTimeout : timeout);
	};

	useEffect(() => {
		setValue(state.uiValue);
	}, [state.uiValue]);

	const onCancel = acceptRejectMode && state.dirty ? () => handleChange(state.execValue, 0) : undefined;

	// calculate the step size which depends on the parameter type
	let step = 1;
	if (definition.type === PARAMETER_TYPE.INT) {
		step = 1;
	} else if (definition.type === PARAMETER_TYPE.EVEN || definition.type === PARAMETER_TYPE.ODD) {
		step = 2;
	} else {
		step = 1 / Math.pow(10, definition.decimalplaces!);
	}

	// choose width of numeric input based on number of decimals

	// tooltip, marks
	const tooltip = `Min: ${definition.min}, Max: ${definition.max}`;
	const marks = [{value: +definition.min!, label: definition.min}, {value: +definition.max!, label: definition.max}];
	
	return <>
		<ParameterLabelComponent { ...props } cancel={onCancel}/>
		{definition && <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
			{ definition && <Slider
				style={{ width: "55%" }}
				label={round(definition, +value)}
				value={+value}
				min={+definition.min!}
				max={+definition.max!}
				step={step}
				onChange={v => setValue(round(definition, v))}
				onChangeEnd={v => handleChange(round(definition, v), 0)}
				marks={marks}
				disabled={disableIfDirty && state.dirty}
			/> }
			{ definition && <Tooltip label={tooltip} position="bottom"><NumberInput
				style={{ width: "40%" }}
				value={value}
				min={+definition.min!}
				max={+definition.max!}
				step={step}
				decimalScale={definition.decimalplaces}
				fixedDecimalScale={true}
				clampBehavior="strict"
				onChange={v => handleChange(round(definition, +v))}
				disabled={disableIfDirty && state.dirty}
			/></Tooltip> }
		</div>}
	</>;
}
