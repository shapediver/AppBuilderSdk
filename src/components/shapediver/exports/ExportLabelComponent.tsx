import { Text } from "@mantine/core";
import React, { JSX } from "react";
import { PropsExport } from "types/components/shapediver/propsExport";

/**
 * Functional component that creates a label for an export.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ExportLabelComponent(props: PropsExport): JSX.Element {
	const { definition } = props;

	return <Text style={{ paddingBottom: "0.25rem" }} size="sm" fw={500}>{definition.displayname || definition.name}</Text>;
}
