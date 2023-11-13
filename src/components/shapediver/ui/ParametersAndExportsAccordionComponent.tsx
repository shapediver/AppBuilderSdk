import React, { JSX } from "react";
import { Accordion, Button, Divider, Loader, ScrollArea } from "@mantine/core";
import { getExportComponent, getParameterComponent } from "types/components/shapediver/componentTypes";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { PropsExport } from "types/components/shapediver/propsExport";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useSortedParametersAndExports } from "hooks/useSortedParametersAndExports";
import { useParameterChanges } from "hooks/useParameterChanges";
import classes from "./ParametersAndExportsAccordionComponent.module.css";

/**
 * Functional component that creates an accordion of parameter and export components.
 *
 * @returns
 */

interface Props {
	parameters?: PropsParameter[],
	exports?: PropsExport[],
	defaultGroupName?: string,
}

export default function ParametersAndExportsAccordionComponent({ parameters, exports, defaultGroupName}: Props) {
	// get sorted list of parameter and export definitions
	const sortedParamsAndExports = useSortedParametersAndExports(parameters, exports);

	const acceptRejectMode = sortedParamsAndExports.some(p => p.parameter?.acceptRejectMode);

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

	// create a data structure to store the elements within groups
	const elementGroups: {
		[key: string]: {
			group: { id: string, name: string }
			elements: JSX.Element[],
		}
	} = {};

	// as long as there are no parameters, show a loader
	if (sortedParamsAndExports.length === 0) {
		return(<Loader className={classes.loader} size="xl" variant="dots" />);
	}

	// loop through the parameters and store the created elements in the elementGroups
	sortedParamsAndExports.forEach(param => {
		// if a parameter is hidden, skip it
		if (param.definition.hidden) return;

		// read out the group or specify a new one if none has been provided
		const group = param.definition.group || { id: "default", name: defaultGroupName || "Default Group" };
		if (!elementGroups[group.id]) {
			elementGroups[group.id] = {
				group,
				elements: []
			};
		}

		if (param.parameter) {
			// Get the element for the parameter and add it to the group
			const ParameterComponent = getParameterComponent(param.definition);

			elementGroups[group.id].elements.push(
				<div key={param.definition.id}>
					<ParameterComponent
						sessionId={param.parameter.sessionId}
						parameterId={param.parameter.parameterId}
						disableIfDirty={!acceptRejectMode}
						acceptRejectMode={param.parameter.acceptRejectMode}
					/>
				</div>
			);
		}
		else if (param.export) {
			// Get the element for the export and add it to the group
			const ExportComponent = getExportComponent(param.definition);

			elementGroups[group.id].elements.push(
				<div key={param.definition.id}>
					<ExportComponent
						sessionId={param.export.sessionId}
						exportId={param.export.exportId} />
				</div>
			);
		}
	});

	let acceptRejectElement: JSX.Element | undefined;

	if (acceptRejectMode) {
		acceptRejectElement =
			<div key="acceptOrReject" className={classes.acceptRejectContainer}>
				<Button
					className={classes.acceptRejectButton}
					fullWidth={true}
					leftSection={<IconCheck />}
					variant="default"
					onClick={acceptChanges}
					disabled={disableChangeControls}
				>
			Accept
				</Button>
				<Button
					className={classes.acceptRejectButton}
					fullWidth={true}
					leftSection={<IconX />}
					variant="default"
					onClick={rejectChanges}
					disabled={disableChangeControls}
				>
			Reject
				</Button>
			</div>;
	}

	const elements: JSX.Element[] = [];

	// loop through the created elementGroups to add them
	for (const e in elementGroups) {
		const g = elementGroups[e];

		// add dividers between the elements
		const groupElements: JSX.Element[] = [];
		g.elements.forEach((element, index) => {
			groupElements.push(element);
			if (index !== g.elements.length - 1) groupElements.push(<Divider key={element.key + "_divider"} my="sm" />);
		});

		// create an Accordion.Item for each element
		elements.push(
			<Accordion.Item key={g.group.id} value={g.group.id}>
				<Accordion.Control>{g.group.name}</Accordion.Control>
				<Accordion.Panel key={g.group.id}>
					{groupElements}
				</Accordion.Panel>
			</Accordion.Item>
		);
	}

	return <Accordion variant="contained" radius="md" className={classes.container}>
		{ acceptRejectElement }
		<ScrollArea.Autosize className={classes.scrollArea}>
			{ elements }
		</ScrollArea.Autosize>
	</Accordion>;
}
