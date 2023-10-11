import { Text } from "@mantine/core";
import { useExport } from "hooks/useExport";
import React, { JSX } from "react";
import { PropsExport } from "types/components/shapediver/propsExport";

/**
 * Functional component that creates a label for an export.
 *
 * @returns
 */
export default function ExportLabelComponent(props: PropsExport): JSX.Element {
	const { sessionId, exportId } = props;
	const { definition } = useExport(sessionId, exportId);
	
	return <Text style={{ paddingBottom: "0.25rem" }} size="sm" fw={500}>{definition.displayname || definition.name}</Text>;
}
