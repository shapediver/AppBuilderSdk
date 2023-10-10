import { Slider, TextInput } from "@mantine/core";
import { PARAMETER_TYPE } from "@shapediver/viewer";
import React, { JSX, useEffect, useRef, useState } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { ISdReactParameterDefinition } from "types/shapediver/parameter";
import { PropsParameters } from "types/components/shapediver/propsParameter";

/**
 * Round the number depending on the parameter type.
 *
 * @param parameter
 * @param n
 * @returns
 */
const round = (parameter: ISdReactParameterDefinition, n: number) => {
	if (parameter.type === PARAMETER_TYPE.INT || parameter.type === PARAMETER_TYPE.EVEN || parameter.type === PARAMETER_TYPE.ODD)
		n = +n.toFixed(0);
	n = +n.toFixed(parameter.decimalplaces);

	return n;
};

/**
 * Functional component that creates a slider component for a number parameter.
 * Additionally, a text input is added on the side.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterSliderComponent(props: PropsParameters<number>): JSX.Element {
	const { definition, actions } = props;
	const textInputRef = useRef<HTMLInputElement>(null);
	const [value, setValue] = useState(0);
	const [textValue, setTextValue] = useState("");
	const [step, setStep] = useState(1);

	// callback for when the value was changed
	const handleChange = (inputValue: number) => {
		// set the value and customize the session
		if (actions.setUiValue(round(definition, inputValue))) {
			actions.execute();
		}
	};

	let zoomResizeTimeout: NodeJS.Timeout;
	// callback for when the text value has been changed
	// instead of applying the value directly, set a timeout to wait on further input
	// if this input does not happen within 500ms, clean the value and execute the handleChange-callback
	const handleChangeDelay = () => {
		if (textInputRef.current)
			setTextValue(textInputRef.current.value);

		clearTimeout(zoomResizeTimeout);
		zoomResizeTimeout = setTimeout(() => {
			if (!textInputRef.current) return;

			// if the text input value was not a number, reset it to the slider value
			if (isNaN(+textInputRef.current.value)) return setTextValue(value + "");

			let inputValue: number = +textInputRef.current.value;
			// if the text input value was not within the min and max, reset it to the slider value
			if (!(inputValue >= +definition.min! && inputValue <= +definition.max!)) return setTextValue(value + "");

			// round the value according to the parameter type
			inputValue = round(definition, inputValue);

			// set the slider value and text value accordingly
			setValue(inputValue);
			setTextValue(inputValue + "");

			// execute the handleChange callback
			handleChange(inputValue);
		}, 500);
	};

	useEffect(() => {
		setValue(+definition.defval);
		setTextValue(definition.defval);

		// calculate the step size which depends on the parameter type
		if (definition.type === PARAMETER_TYPE.INT) {
			setStep(1);
		} else if (definition.type === PARAMETER_TYPE.EVEN || definition.type === PARAMETER_TYPE.ODD) {
			setStep(2);
		} else {
			setStep(1 / Math.pow(10, definition.decimalplaces!));
		}
	}, [definition]);

	return <>
		<ParameterLabelComponent { ...props } />
		{definition && <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
			{ definition && <Slider
				style={{ width: "65%" }}
				label={round(definition, value)}
				defaultValue={+value}
				min={+definition.min!}
				max={+definition.max!}
				step={step}
				value={value}
				onChange={(v) => {
					setValue(v);
					setTextValue(round(definition, v) + "");
				}}
				onChangeEnd={handleChange}
			/> }
			{ definition && <TextInput
				ref={textInputRef}
				style={{ width: "30%" }}
				value={textValue}
				onChange={handleChangeDelay}
			/> }
		</div>}
	</>;
}
