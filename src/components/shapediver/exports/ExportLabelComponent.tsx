import { Skeleton, Text } from "@mantine/core";
import React, { JSX, useEffect, useState } from "react";
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
	const [loading, setLoading] = useState(true);
	const [element, setElement] = useState(<></>);

	useEffect(() => {
		// early return if the export is not it the store (yet)
		if (!exp) return;

		// deactivate the loading mode
		setLoading(false);

		setElement(<Text style={{ paddingBottom: "0.25rem" }} size="sm" fw={500}>{exp.definition.displayname || exp.definition.name}</Text>);
	}, [exp]);

	return (
		<>
			{loading && <Skeleton height={8} mt={6} radius="xl" />}
			{!loading && element}
		</>
	);
}
