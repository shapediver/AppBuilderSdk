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
	const parameterChanges = useParameterChanges(parameters ?? []);

	// check if there is at least one parameter for which changes can be accepted or rejected
	const showButtons = parameters?.some(p => p.acceptRejectMode);

	// disable the accept and reject buttons if there are no changes or 
	// if there are changes that are currently being executed
	const disableChangeControls = parameterChanges.length === 0 ||
		parameterChanges.some(c => c.executing);
	const acceptChanges = () => {
		parameterChanges.forEach(c => c.accept());
	};
	const rejectChanges = () => {
		parameterChanges.forEach(c => c.reject());
	};

	return !showButtons ? <></> : <>
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
