import { Center, Loader, LoaderProps } from "@mantine/core";
import React from "react";


interface Props {
	/** error message */
	children?: React.ReactNode;
}

/**
 * Full screen alert page
 *
 * @returns
 */
export default function LoaderPage(props: Props & LoaderProps) {

	const { children, ...rest } = props;

	return (
		<Center w="100vw" h="100vh">
			<Loader {...rest}>
				{children}
			</Loader>
		</Center>
	);
}
