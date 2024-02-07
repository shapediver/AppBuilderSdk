import { PropsParameter } from "../../../types/components/shapediver/propsParameter";
import { useParameterChanges } from "../../../hooks/shapediver/useParameterChanges";
import classes from "./AcceptRejectButtons.module.css";
import { Button, Container } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import React from "react";


interface Props {
	parameters?: PropsParameter[],
}

export default function AcceptRejectButtons({ parameters }: Props) {
	// check if there are parameter changes to be confirmed
	const parameterChanges = useParameterChanges(parameters || []);
	const disableChangeControls = parameterChanges.length === 0 ||
		parameterChanges.every(c => c.disableControls ) ||
		parameterChanges.some(c => c.executing);
	const acceptChanges = () => {
		parameterChanges.forEach(c => c.accept());
	};
	const rejectChanges = () => {
		parameterChanges.forEach(c => c.reject());
	};

	return <>
		<Container key="acceptOrReject" p="0" mb="xs" className={classes.acceptRejectContainer}>
			<Button
				fullWidth={true}
				leftSection={<IconCheck />}
				variant="default"
				onClick={acceptChanges}
				disabled={disableChangeControls}
			>
				Accept
			</Button>
			<Button
				fullWidth={true}
				leftSection={<IconX />}
				variant="default"
				onClick={rejectChanges}
				disabled={disableChangeControls}
			>
				Reject
			</Button>
		</Container>
	</>;
}
