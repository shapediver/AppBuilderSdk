import React, { JSX } from "react";
import { Accordion, Group, Loader, Paper, Stack, useProps } from "@mantine/core";
import { getExportComponent, getParameterComponent } from "types/components/shapediver/componentTypes";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { PropsExport } from "types/components/shapediver/propsExport";
import { useSortedParametersAndExports } from "hooks/shapediver/useSortedParametersAndExports";

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
	 * In case this is not set or true, parameters and exports of groups with a single
	 * component will be displayed without using an accordion.
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
	/**
	 * Bottom padding of Paper component wrapping slider components.
	 */
	pbSlider?: string,
}

const defaultProps: Partial<Props> = {
	avoidSingleComponentGroups: true,
	mergeAccordions: false,
	pbSlider: "md",
};

export default function ParametersAndExportsAccordionComponent(props: Props) {

	const { parameters, exports, defaultGroupName, topSection} = props;

	// get sorted list of parameter and export definitions
	const sortedParamsAndExports = useSortedParametersAndExports(parameters, exports);

	// style properties
	const { pbSlider, avoidSingleComponentGroups, mergeAccordions } = useProps("ParametersAndExportsAccordionComponent", defaultProps, props);

	// create a data structure to store the elements within groups
	const elementGroups: {
			group?: { id: string, name: string }
			elements: JSX.Element[],
	}[] = [];
	const groupIds: { [key: string]: number } = {};

	// as long as there are no parameters, show a loader
	if (sortedParamsAndExports.length === 0) {
		return(<Group justify="center" pt="50"><Loader size="xl" variant="dots" /></Group>);
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
			const { component: ParameterComponent, extraBottomPadding } = getParameterComponent(param.definition);

			elementGroups[groupId].elements.push(
				<Paper key={param.definition.id} pb={extraBottomPadding ? pbSlider : undefined}>
					<ParameterComponent
						sessionId={param.parameter.sessionId}
						parameterId={param.parameter.parameterId}
						disableIfDirty={param.parameter.disableIfDirty ?? !param.parameter.acceptRejectMode}
						acceptRejectMode={param.parameter.acceptRejectMode}
					/>
				</Paper>
			);
		}
		else if (param.export) {
			// Get the element for the export and add it to the group
			const ExportComponent = getExportComponent(param.definition);

			elementGroups[groupId].elements.push(
				<Paper key={param.definition.id}>
					<ExportComponent
						sessionId={param.export.sessionId}
						exportId={param.export.exportId} />
				</Paper>
			);
		}
	});

	const elements: JSX.Element[] = [];
	const addAccordion = (items: JSX.Element[], defaultValue: string | undefined = undefined) => {
		elements.push(
			// wrap accordion in paper to show optional shadows
			<Paper px={0} py={0} withBorder={false}><Accordion key={items[0].key} defaultValue={defaultValue}>
				{ items }
			</Accordion></Paper>
		);
	};

	// in case there is only one group, open it by default
	const defaultValue = elementGroups.length === 1 && elementGroups[0].group ? elementGroups[0].group?.id : undefined;

	// loop through the created elementGroups to add them
	let accordionItems: JSX.Element[] = [];
	for (const g of elementGroups) {

		if (g.group && (!avoidSingleComponentGroups || g.elements.length > 1)) {
			accordionItems.push(
				<Accordion.Item key={g.group.id} value={g.group.id}>
					<Accordion.Control>{g.group.name}</Accordion.Control>
					<Accordion.Panel key={g.group.id}>
						<Stack>
							{g.elements}
						</Stack>
					</Accordion.Panel>
				</Accordion.Item>
			);
			if (!mergeAccordions) {
				addAccordion(accordionItems, defaultValue);
				accordionItems = [];
			}
		}
		else {
			if (accordionItems.length > 0) {
				addAccordion(accordionItems, defaultValue);
				accordionItems = [];
			}
			elements.push(g.elements[0]);
		}
	}
	if (accordionItems.length > 0) {
		addAccordion(accordionItems, defaultValue);
	}

	return <>
		{ topSection }
		<Stack>
			{ elements }
		</Stack>
	</>;
}
