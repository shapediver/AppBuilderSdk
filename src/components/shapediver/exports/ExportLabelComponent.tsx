import { Skeleton, Text } from "@mantine/core";
import React, { JSX } from "react";
import { ISdReactExport } from "../../../types/shapediver/export";

interface Props {
	exp: ISdReactExport
}

/**
 * Functional component that creates a label for an export.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ExportLabelComponent({ exp }: Props): JSX.Element {
	return (
		<>
			{!exp && <Skeleton height={8} mt={6} radius="xl" />}
			{exp && <Text style={{ paddingBottom: "0.25rem" }} size="sm" fw={500}>{exp.definition.displayname || exp.definition.name}</Text>}
		</>
	);
}
