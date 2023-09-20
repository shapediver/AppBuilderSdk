import { Text } from "@mantine/core";
import React, { JSX, useEffect, useRef, useState } from "react";
import ParameterComponentBase from "components/shapediver/parameter/ParameterComponentBase";
import { PropsParameters } from "types/components/shapediver/uiParameter";
import { useShapediverStoreCommon } from "context/shapediverStoreCommon";

/**
 * Functional component that creates a label for a parameter.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterLabelComponent({ parameterId, sessionId }: PropsParameters): JSX.Element {
	const sessionParameters = useRef(useShapediverStoreCommon(state => state.parameters[sessionId]));
	const [loading, setLoading] = useState(true);
	const [element, setElement] = useState(<></>);

	useEffect(() => {
		const parameter = sessionParameters.current ? sessionParameters.current[parameterId] : undefined;

		// early return if the parameter is not in the store (yet)
		if (!parameter) return;

		// deactivate the loading mode
		setLoading(false);

		setElement(<Text style={{ paddingBottom: "0.25rem" }} size="sm" fw={500}>{parameter.displayname || parameter.name}</Text>);
	}, [sessionId, parameterId]);

	return (<ParameterComponentBase loading={loading} element={element} />);
}
