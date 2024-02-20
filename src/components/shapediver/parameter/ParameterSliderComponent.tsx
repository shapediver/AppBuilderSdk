import { Group, NumberInput, Slider, Tooltip, useProps } from "@mantine/core";
import React from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { IShapeDiverParameterDefinition } from "types/shapediver/parameter";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { useParameterComponentCommons } from "hooks/shapediver/useParameterComponentCommons";
import { ShapeDiverResponseParameterType } from "@shapediver/api.geometry-api-dto-v2";

/**
 * Round the number depending on the parameter type.
 *
 * @param parameter
 * @param n
 * @returns
 */
const round = (parameter: IShapeDiverParameterDefinition, n: number) => {
	if (parameter.type === ShapeDiverResponseParameterType.INT || parameter.type === ShapeDiverResponseParameterType.EVEN || parameter.type === ShapeDiverResponseParameterType.ODD)
		n = +n.toFixed(0);
	n = +n.toFixed(parameter.decimalplaces);

	return n;
};

interface StyleProps {
	sliderWidth: string | number | undefined;
	numberWidth: string | number | undefined;
}

const defaultStyleProps: Partial<StyleProps> = {
	sliderWidth: "60%",
	numberWidth: "35%",
};

/**
 * Functional component that creates a slider component for a number parameter.
 * Additionally, a text input is added on the side.
 *
 * @returns
 */
export default function ParameterSliderComponent(props: PropsParameter & Partial<StyleProps>) {

	const {
		definition,
		value,
		setValue,
		handleChange,
		onCancel,
		disabled
	} = useParameterComponentCommons<number>(props);

	// style properties
	const { sliderWidth, numberWidth } = useProps("ParameterSliderComponent", defaultStyleProps, props);

	// calculate the step size which depends on the parameter type
	let step = 1;
	if (definition.type === ShapeDiverResponseParameterType.INT) {
		step = 1;
	} else if (definition.type === ShapeDiverResponseParameterType.EVEN || definition.type === ShapeDiverResponseParameterType.ODD) {
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
		{definition && <Group justify="space-between" w="100%" wrap="nowrap">
			{ definition && <Slider
				w={sliderWidth}
				label={round(definition, +value)}
				value={+value}
				min={+definition.min!}
				max={+definition.max!}
				step={step}
				onChange={v => setValue(round(definition, v))}
				onChangeEnd={v => handleChange(round(definition, v), 0)}
				marks={marks}
				disabled={disabled}
			/> }
			{ definition && <Tooltip label={tooltip} position="bottom"><NumberInput
				w={numberWidth}
				value={value}
				min={+definition.min!}
				max={+definition.max!}
				step={step}
				decimalScale={definition.decimalplaces}
				fixedDecimalScale={true}
				clampBehavior="strict"
				onChange={v => handleChange(round(definition, +v))}
				disabled={disabled}
			/></Tooltip> }
		</Group>}
	</>;
}
