import { Slider, TextInput } from "@mantine/core";
import { IParameterApi, PARAMETER_TYPE } from "@shapediver/viewer";
import React, { JSX, useEffect, useRef, useState } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import ParameterComponentBase from "components/shapediver/parameter/ParameterComponentBase";
import { PropsParameters } from "types/components/shapediver/parameters";
import { useShapediverViewerStore } from "context/shapediverViewerStore";

/**
 * Round the number depending on the parameter type.
 *
 * @param parameter
 * @param n
 * @returns
 */
const round = (parameter: IParameterApi<number>, n: number) => {
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
export default function ParameterSliderComponent({ parameterId, sessionId }: PropsParameters): JSX.Element {
	const sessionParameters = useRef(useShapediverViewerStore(state => state.parameters[sessionId]));
	const changeParameterProperty = useShapediverViewerStore((state) => state.parameterPropertyChange);
	const textInputRef = useRef<HTMLInputElement>(null);
	const [loading, setLoading] = useState(false);
	const [element, setElement] = useState(<></>);
	const [value, setValue] = useState(0);
	const [textValue, setTextValue] = useState("");

	useEffect(() => {
		const parameter = sessionParameters.current ? sessionParameters.current[parameterId] : undefined;

		// early return if the parameter is not in the store (yet)
		if (!parameter) return;

		// set the default value on the slider and the text input
		setValue(+parameter.defval);
		setTextValue(parameter.defval);
	}, []);

	useEffect(() => {
		const parameter = sessionParameters.current ? sessionParameters.current[parameterId] : undefined;

		// early return if the parameter is not in the store (yet)
		if (!parameter) return;

		setLoading(false);

		// deactivate the loading mode
		setLoading(false);

		// calculate the step size which depends on the parameter type
		let step = 1;
		if (parameter.type === PARAMETER_TYPE.INT) {
			step = 1;
		} else if (parameter.type === PARAMETER_TYPE.EVEN || parameter.type === PARAMETER_TYPE.ODD) {
			step = 2;
		} else {
			step = 1 / Math.pow(10, parameter.decimalplaces!);
		}

		// callback for when the value was changed
		const handleChange = (inputValue: number) => {
			// set the value and customize the session
			changeParameterProperty(sessionId, parameterId, "value", round(parameter, inputValue));
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
				if (!(inputValue >= +parameter.min! && inputValue <= +parameter.max!)) return setTextValue(value + "");

				// round the value according to the parameter type
				inputValue = round(parameter, inputValue);

				// set the slider value and text value accordingly
				setValue(inputValue);
				setTextValue(inputValue + "");

				// execute the handleChange callback
				handleChange(inputValue);
			}, 500);
		};

		// set the element with the label, slider and a text input component
		// the slider triggers the handleChange-callback directly, whereas the text input triggers the handleChangeDelay callback
		// the slider min, max and step are set according to the parameter specification
		setElement(
			<>
				<ParameterLabelComponent sessionId={sessionId} parameterId={parameterId} />
				<div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
					<Slider
						style={{ width: "65%" }}
						label={round(parameter, value)}
						defaultValue={+parameter.value}
						min={+parameter.min!}
						max={+parameter.max!}
						step={step}
						value={value}
						onChange={(v) => {
							setValue(v);
							setTextValue(round(parameter, v) + "");
						}}
						onChangeEnd={handleChange}
					/>
					<TextInput
						ref={textInputRef}
						style={{ width: "30%" }}
						value={textValue}
						onChange={handleChangeDelay}
					/>
				</div>
			</>
		);
	}, [sessionId, parameterId, loading, value, textValue]);

	return (<ParameterComponentBase loading={loading} element={element} />);
}
