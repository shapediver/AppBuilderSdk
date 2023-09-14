import { Skeleton, Text } from "@mantine/core";
import React, { useEffect, useRef, useState, JSX } from "react";
import { useShapediverViewerStore } from "../../../context/shapediverViewerStore";

interface Props {
    // The unique identifier to use to access the session.
    sessionId: string,
    // The unique identifier to use to access the export.
    exportId: string
}

/**
 * Functional component that creates a label for an export.
 * It displays a Skeleton if the session is not accessible yet.
 *
 * @returns
 */
export default function ExportLabelComponent({ sessionId, exportId }: Props): JSX.Element {
	const sessionExports = useRef(useShapediverViewerStore(state => state.exports[sessionId]));
	const [loading, setLoading] = useState(true);
	const [element, setElement] = useState(<></>);

	useEffect(() => {
		const exp = sessionExports.current ? sessionExports.current[exportId] : undefined;

		// early return if the export is not it the store (yet)
		if (!exp) return;

		// deactivate the loading mode
		setLoading(false);

		setElement(<Text style={{ paddingBottom: "0.25rem" }} size="sm" fw={500}>{exp.displayname || exp.name}</Text>);
	}, [sessionId, exportId]);

	return (
		<>
			{loading && <Skeleton height={8} mt={6} radius="xl" />}
			{!loading && element}
		</>
	);
}
