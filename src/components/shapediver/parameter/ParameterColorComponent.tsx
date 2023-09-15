import { ActionIcon, ColorInput } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import React, { JSX, useEffect, useRef, useState } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import ParameterComponentBase from "components/shapediver/parameter/ParameterComponentBase";
import { PropsParameters } from "types/components/shapediver/parameters";
import { useShapediverViewerStore } from "context/shapediverViewerStore";

/**
 * Functional component that creates a color swatch for a color parameter.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterColorComponent({ parameterId, sessionId }: PropsParameters): JSX.Element {
	const sessionParameters = useRef(useShapediverViewerStore(state => state.parameters[sessionId]));
	const changeParameterProperty = useShapediverViewerStore((state) => state.parameterPropertyChange);
	const [loading, setLoading] = useState(true);
	const [element, setElement] = useState(<></>);
	let defaultValue = "";
	const [value, setValue] = useState("");

	useEffect(() => {
		const parameter = sessionParameters.current ? sessionParameters.current[parameterId] : undefined;

		// early return if the parameter is not in the store (yet)
		if (!parameter) return;

		// set the default value
		if (!defaultValue) {
			defaultValue = (parameter.defval).replace("0x", "#").substring(0, 7);
			setValue(defaultValue);
		}

		// deactivate the loading mode
		setLoading(false);

		// callback for when the value was changed
		const handleChange = (colorValue: string) => {
			if (!parameter) return;

			// set the value and customize the session
			changeParameterProperty(sessionId, parameterId, "value", colorValue);
		};

		// set the element with the label and a color input that triggers the handleChange-callback onChangeEnd
		// a button is added to the right to reset the value to the default
		// NOTE: the onChange even does not trigger the handleChange-callback as this would send too many requests
		setElement(
			<>
				<ParameterLabelComponent sessionId={sessionId} parameterId={parameterId} />
				<ColorInput
					styles={() => ({
						input: { cursor: "pointer" }
						// track: { cursor: "pointer" },
					})}
					placeholder="Pick color"
					value={value}
					onChange={setValue}
					rightSection={
						<ActionIcon onClick={() => {
							setValue(defaultValue);
							handleChange(defaultValue);
						}}>
							<IconRefresh size={16} />
						</ActionIcon>
					}
					onChangeEnd={handleChange}
				/>
			</>
		);
	}, [sessionId, parameterId, loading, value]);

	return (<ParameterComponentBase loading={loading} element={element} />);
}
