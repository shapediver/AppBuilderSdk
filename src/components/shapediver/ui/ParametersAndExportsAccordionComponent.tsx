import React, { JSX } from "react";
import { Accordion, Button, Divider, Loader } from "@mantine/core";
import { getExportComponent, getParameterComponent } from "types/components/shapediver/componentTypes";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { PropsExport } from "types/components/shapediver/propsExport";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useSortedParametersAndExports } from "hooks/useSortedParametersAndExports";
import { useParameterChanges } from "hooks/useParameterChanges";

/**
 * Functional component that creates an accordion of parameter and export components.
 *
 * @returns
 */

interface Props {
	parameters?: PropsParameter[],
	exports?: PropsExport[],
	defaultGroupName?: string,
	acceptRejectMode?: boolean,
}

export default function ParametersAndExportsAccordionComponent(props: Props): JSX.Element {
	const {parameters, exports, defaultGroupName, acceptRejectMode} = props;

	// get sorted list of parameter and export definitions
	const sortedParamsAndExports = useSortedParametersAndExports(parameters, exports);

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
		return(<Loader style={{ width: "100%" }} mt="xl" size="xl" variant="dots" />);
	}

	// loop through the parameters and store the created elements in the elementGroups
	for (let i = 0; i < sortedParamsAndExports.length; i++) {
		const param = sortedParamsAndExports[i];

		// if a parameter is hidden, skip it
		if (param.definition.hidden) continue;

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
						disableIfDirty={!acceptRejectMode} />
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
	}

	const elements: JSX.Element[] = [];

	if (acceptRejectMode) {
		elements.push(
			<div key="acceptOrReject" style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
				<Button 
					style={{
						width: "70%"
					}}
					fullWidth={true}
					leftSection={<IconCheck />}
					variant="default"
					onClick={acceptChanges}
					disabled={disableChangeControls}
				>
			Accept
				</Button>
				<Button
					style={{
						width: "70%"
					}}
					fullWidth={true}
					leftSection={<IconX />}
					variant="default"
					onClick={rejectChanges}
					disabled={disableChangeControls}
				>
			Reject
				</Button>
			</div>
		);
	}

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
				<Accordion.Panel
					key={g.group.id}
					style={{ background: "light-dark(var(--mantine-color-dark-8), var(--mantine-color-gray-0))" }}
				>
					{groupElements}
				</Accordion.Panel>
			</Accordion.Item>
		);
	}

	return <Accordion variant="contained" radius="md">
		{ elements }
	</Accordion>;
}
