import { Text } from "@mantine/core";
import { useParameter } from "hooks/useParameter";
import React, { JSX } from "react";
import { PropsParameter } from "types/components/shapediver/propsParameter";

/**
 * Functional component that creates a label for a parameter or .
 *
 * @returns
 */
export default function ParameterLabelComponent(props: PropsParameter): JSX.Element {
	const { sessionId, parameterId } = props;
	const { definition } = useParameter<any>(sessionId, parameterId);
	
	return <Text style={{ paddingBottom: "0.25rem" }} size="sm" fw={500}>{definition.displayname || definition.name}</Text>;
}
