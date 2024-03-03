import { Alert, AlertProps, Stack } from "@mantine/core";
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
		<Stack mih="100vh" justify="center" align="center">
			<Alert maw="480" {...rest}>
				{children}
			</Alert>
		</Stack>
	);
}
