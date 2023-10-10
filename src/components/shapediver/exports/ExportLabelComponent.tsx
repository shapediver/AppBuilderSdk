import { Text } from "@mantine/core";
import React, { JSX } from "react";
import { useShapediverStoreParameters } from "store/parameterStore";
import { PropsExport } from "types/components/shapediver/propsExport";
import { ISdReactExport } from "types/shapediver/export";

/**
 * Functional component that creates a label for an export.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ExportLabelComponent(props: PropsExport): JSX.Element {
	const { sessionId, exportId } = props;
	const parametersStore = useShapediverStoreParameters();
	const { definition } = parametersStore.useExport(sessionId, exportId)(state => state as ISdReactExport);
	
	return <Text style={{ paddingBottom: "0.25rem" }} size="sm" fw={500}>{definition.displayname || definition.name}</Text>;
}
