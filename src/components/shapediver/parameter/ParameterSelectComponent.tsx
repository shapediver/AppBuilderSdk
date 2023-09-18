import { Select } from "@mantine/core";
import React, { JSX, useEffect, useRef, useState } from "react";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import ParameterComponentBase from "components/shapediver/parameter/ParameterComponentBase";
import { PropsParameters } from "types/components/shapediver/parameters";
import { useShapediverViewerStore } from "context/shapediverViewerStore";

/**
 * Functional component that creates a dropdown select component for a string list parameter.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterSelectComponent({ parameterId, sessionId }: PropsParameters): JSX.Element {
	const sessionParameters = useRef(useShapediverViewerStore(state => state.parameters[sessionId]));
	const changeParameterProperty = useShapediverViewerStore((state) => state.parameterPropertyChange);
	const [loading, setLoading] = useState(false);
	const [element, setElement] = useState(<></>);

	useEffect(() => {
		const parameter = sessionParameters.current ? sessionParameters.current[parameterId] : undefined;

		// early return if the parameter is not in the store (yet)
		if (!parameter) return;

		setLoading(false);

		// callback for when the value was changed
		const handleChange = (value: string) => {
			if (!parameter) return;

			changeParameterProperty(sessionId, parameterId, "value", parameter.choices!.indexOf(value) + "");
		};

		// set the element with the label and a Select component that triggers the handleChange-callback
		setElement(
			<>
				<ParameterLabelComponent sessionId={sessionId} parameterId={parameterId} />
				<Select
					placeholder="Pick one"
					dropdownPosition="bottom"
					defaultValue={parameter.choices![+parameter.defval]}
					onChange={handleChange}
					data={parameter.choices!}
				/>
			</>
		);
	}, [sessionId, parameterId]);

	return (<ParameterComponentBase loading={loading} element={element} />);
}
