import { Text } from "@mantine/core";
import React, { JSX } from "react";
import { useShapeDiverStoreParameters } from "store/shapediverStoreParameters";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { IShapeDiverParameter } from "types/shapediver/parameter";

/**
 * Functional component that creates a label for a parameter or .
 *
 * @returns
 */
export default function ParameterLabelComponent(props: PropsParameter): JSX.Element {
	const { sessionId, parameterId } = props;
	const parametersStore = useShapeDiverStoreParameters();
	const { definition } = parametersStore.useParameter(sessionId, parameterId)(state => state as IShapeDiverParameter<any>);
	
	return <Text style={{ paddingBottom: "0.25rem" }} size="sm" fw={500}>{definition.displayname || definition.name}</Text>;
}
