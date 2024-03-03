import { Alert, AlertProps, Center } from "@mantine/core";
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
export default function AlertPage(props: Props & AlertProps) {

	const { children, ...rest } = props;

	return (
		<Center w="100vw" h="100vh">
			<Alert {...rest}>
				{children}
			</Alert>
		</Center>
	);
}
