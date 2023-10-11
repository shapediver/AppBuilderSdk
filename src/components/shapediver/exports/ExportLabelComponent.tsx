import { Text } from "@mantine/core";
import React, { JSX } from "react";
import { useShapeDiverStoreParameters } from "store/shapediverStoreParameters";
import { PropsExport } from "types/components/shapediver/propsExport";
import { IShapeDiverExport } from "types/shapediver/export";

/**
 * Functional component that creates a label for an export.
 *
 * @returns
 */
export default function ExportLabelComponent(props: PropsExport): JSX.Element {
	const { sessionId, exportId } = props;
	const parametersStore = useShapeDiverStoreParameters();
	const { definition } = parametersStore.useExport(sessionId, exportId)(state => state as IShapeDiverExport);
	
	return <Text style={{ paddingBottom: "0.25rem" }} size="sm" fw={500}>{definition.displayname || definition.name}</Text>;
}
