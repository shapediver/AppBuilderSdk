import { Text } from "@mantine/core";
import React, { JSX } from "react";
import { PropsParameters } from "types/components/shapediver/propsParameter";

/**
 * Functional component that creates a label for a parameter or .
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ParameterLabelComponent(props: PropsParameters<any>): JSX.Element {
	const { definition } = props;

	return <Text style={{ paddingBottom: "0.25rem" }} size="sm" fw={500}>{definition.displayname || definition.name}</Text>;
}
