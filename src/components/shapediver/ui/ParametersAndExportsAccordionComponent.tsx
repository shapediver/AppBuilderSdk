import React, { JSX } from "react";
import { Accordion, Loader, Paper, ScrollArea } from "@mantine/core";
import { getExportComponent, getParameterComponent } from "types/components/shapediver/componentTypes";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { PropsExport } from "types/components/shapediver/propsExport";
import { useSortedParametersAndExports } from "hooks/shapediver/useSortedParametersAndExports";
import classes from "./ParametersAndExportsAccordionComponent.module.css";

/**
 * Functional component that creates an accordion of parameter and export components.
 *
 * @returns
 */

interface Props {
	/**
	 * The parameters to be displayed in the accordion.
	 */
	parameters?: PropsParameter[],
	/**
	 * The exports to be displayed in the accordion.
	 */
	exports?: PropsExport[],
	/**
	 * Name of group to use for parameters and exports which are not assigned to a group.
	 * Leave this empty to not display such parameters and exports inside of an accordion.
	 */
	defaultGroupName?: string,
	/**
	 * Set this to true to avoid groups containing a single parameter or export component.
	 * In case this is not set or false, parameters and exports of groups with a single
	 * compnent will be displayed without using an accordion.
	 */
	avoidSingleComponentGroups?: boolean,
	/**
	 * Merge accordions of subsequent groups into one.
	 */
	mergeAccordions?: boolean,
	/**
	 * Component to be displayed at the top of the accordion. Typically used for 
	 * accept / reject buttons.
	 */
	topSection?: React.ReactNode,
}

export default function ParametersAndExportsAccordionComponent({ parameters, exports, defaultGroupName, 
	avoidSingleComponentGroups = false, mergeAccordions = false, topSection}: Props) {
	// get sorted list of parameter and export definitions
	const sortedParamsAndExports = useSortedParametersAndExports(parameters, exports);
	const acceptRejectMode = sortedParamsAndExports.some(p => p.parameter?.acceptRejectMode);

	// create a data structure to store the elements within groups
	const elementGroups: {
			group?: { id: string, name: string }
			elements: JSX.Element[],
	}[] = [];
	const groupIds: { [key: string]: number } = {};

	// as long as there are no parameters, show a loader
	if (sortedParamsAndExports.length === 0) {
		return(<section className={classes.loader}><Loader size="xl" variant="dots" /></section>);
	}

	// loop through the parameters and store the created elements in the elementGroups
	sortedParamsAndExports.forEach(param => {
		// if a parameter is hidden, skip it
		if (param.definition.hidden) return;

		// read out the group or specify a new one if none has been provided
		const group = param.definition.group || ( defaultGroupName ? { id: "default", name: defaultGroupName } : undefined);
		if (!group) {
			elementGroups.push({ elements: [] });
		}
		else if (!(group.id in groupIds)) {
			elementGroups.push({ group, elements: [] });
			groupIds[group.id] = elementGroups.length - 1;
		}
		const groupId = group ? groupIds[group.id] : elementGroups.length - 1;

		if (param.parameter) {
			// Get the element for the parameter and add it to the group
			const ParameterComponent = getParameterComponent(param.definition);

			elementGroups[groupId].elements.push(
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

			elementGroups[groupId].elements.push(
				<div key={param.definition.id}>
					<ExportComponent
						sessionId={param.export.sessionId}
						exportId={param.export.exportId} />
				</div>
			);
		}
	});

	const elements: JSX.Element[] = [];
	const addAccordion = (items: JSX.Element[]) => {
		elements.push(
			<Accordion variant="contained" radius="md" mb="xs" className={classes.container} key={items[0].key}>
				{ items }
			</Accordion>
		);
	};

	// loop through the created elementGroups to add them
	let accordionItems: JSX.Element[] = [];
	for (const g of elementGroups) {

		const groupElements: JSX.Element[] = [];
		g.elements.forEach((element) => {
			groupElements.push(
				<Paper withBorder radius="md" shadow="m" mb="xs" py="md" px="xs" key={element.key}>
					{ element }
				</Paper>
			);
		});

		if (g.group && (!avoidSingleComponentGroups || g.elements.length > 1)) {
			accordionItems.push(
				<Accordion.Item key={g.group.id} value={g.group.id}>
					<Accordion.Control>{g.group.name}</Accordion.Control>
					<Accordion.Panel key={g.group.id}>
						{groupElements}
					</Accordion.Panel>
				</Accordion.Item>
			);
			if (!mergeAccordions) {
				addAccordion(accordionItems);
				accordionItems = [];
			}
		}
		else {
			if (accordionItems.length > 0) {
				addAccordion(accordionItems);
				accordionItems = [];
			}
			elements.push(groupElements[0]);
		}
	}
	if (accordionItems.length > 0) {
		addAccordion(accordionItems);
	}

	return <>
		{ topSection }
		<ScrollArea.Autosize className={classes.scrollArea}>
			<>{ elements }</>
		</ScrollArea.Autosize>
	</>;
}
