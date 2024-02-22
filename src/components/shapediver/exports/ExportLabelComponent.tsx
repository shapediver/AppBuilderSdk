import { Text } from "@mantine/core";
import { useExport } from "hooks/shapediver/useExport";
import React from "react";
import { PropsExport } from "types/components/shapediver/propsExport";

/**
 * Functional component that creates a label for an export.
 *
 * @returns
 */
export default function ExportLabelComponent({ sessionId, exportId }: PropsExport) {
	const { definition } = useExport(sessionId, exportId);

	return <Text pb={4} size="sm" fw={500}>
		{definition.displayname || definition.name}
	</Text>;
}
