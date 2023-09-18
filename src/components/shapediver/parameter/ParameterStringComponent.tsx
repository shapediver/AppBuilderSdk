import { TextInput } from "@mantine/core";
import React, { JSX, useEffect, useRef, useState } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import ParameterComponentBase from "components/shapediver/parameter/ParameterComponentBase";
import { PropsParameters } from "types/components/shapediver/parameters";
import { useShapediverViewerStore } from "context/shapediverViewerStore";

/**
 * Functional component that creates a string input component for a string parameter.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterStringComponent({ parameterId, sessionId }: PropsParameters): JSX.Element {
	const sessionParameters = useRef(useShapediverViewerStore(state => state.parameters[sessionId]));
	const changeParameterProperty = useShapediverViewerStore((state) => state.parameterPropertyChange);
	const textInputRef = useRef<HTMLInputElement>(null);
	const [loading, setLoading] = useState(true);
	const [element, setElement] = useState(<></>);

	useEffect(() => {
		const parameter = sessionParameters.current ? sessionParameters.current[parameterId] : undefined;

		// early return if the parameter is not in the store (yet)
		if (!parameter) return;

		setLoading(false);

		// function to apply the value to the parameter and customize the scene
		const handleChange = (value: string) => {
			if (!parameter) return;
			// set the value and customize the session
			changeParameterProperty(sessionId, parameterId, "value", value);
		};

		let zoomResizeTimeout: NodeJS.Timeout;
		// callback for when the text value has been changed
		// instead of applying the value directly, set a timeout to wait on further input
		// if this input does not happen within 500ms, execute the handleChange-callback
		const handleChangeDelay = () => {
			clearTimeout(zoomResizeTimeout);
			zoomResizeTimeout = setTimeout(() => {
				if (textInputRef.current)
					handleChange(textInputRef.current.value);
			}, 500);
		};

		// set the element with the label and a text input component that triggers the handleChangeDelay-callback
		setElement(
			<>
				<ParameterLabelComponent sessionId={sessionId} parameterId={parameterId} />
				<TextInput
					ref={textInputRef}
					style={{
						flexGrow: 0.9
					}}
					defaultValue={parameter.value}
					onChange={handleChangeDelay}
				/>
			</>
		);
	}, [sessionId, parameterId]);

	return (<ParameterComponentBase loading={loading} element={element} />);
}
