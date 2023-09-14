import { Skeleton } from "@mantine/core";
import React, { JSX, ReactElement } from "react";

export interface Props {
	// The loading state
	loading: boolean,
	// Unique parameter element
	element: ReactElement
}

/**
 * Common parameter component that manages the loading state.
 *
 * @returns
 */
export default function ParameterComponentBase({ loading, element }: Props): JSX.Element {
	return (
		<>
			{loading && <Skeleton height={8} mt={6} radius="xl" />}
			{!loading && element}
		</>
	);
}
