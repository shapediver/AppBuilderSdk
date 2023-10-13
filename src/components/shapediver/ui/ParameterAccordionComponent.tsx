import React, { JSX } from "react";
import { Accordion, Divider, Loader, useMantineTheme } from "@mantine/core";
import { getExportComponent, getParameterComponent } from "types/components/shapediver/componentTypes";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { PropsExport } from "types/components/shapediver/propsExport";
import { useShapeDiverStoreParameters } from "store/shapediverStoreParameters";
import { IShapeDiverParamOrExportDefinition } from "types/shapediver/common";

/**
 * Functional component that creates an accordion of parameter and export components.
 *
 * @returns
 */

interface Props {
	parameters?: PropsParameter[],
	exports?: PropsExport[],
	defaultGroupName?: string,
	disableIfDirty?: boolean,
}

interface ParamOrExportDefinition {
	parameter?: PropsParameter,
	export?: PropsExport,
	definition: IShapeDiverParamOrExportDefinition,
}

export default function ParameterAccordionComponent(props: Props): JSX.Element {
	const theme = useMantineTheme();
	const {parameters, exports, defaultGroupName, disableIfDirty} = props;
	const {parameterStores, exportStores} = useShapeDiverStoreParameters();

	// collect definitions of parameters and exports for sorting and grouping
	let sortedParamsAndExports : ParamOrExportDefinition[] = [];
	sortedParamsAndExports = sortedParamsAndExports.concat((parameters || []).map(p => {
		const definition = parameterStores[p.sessionId][p.parameterId].getState().definition;

		return { parameter: p, definition };
	}));
	sortedParamsAndExports = sortedParamsAndExports.concat((exports || []).map(e => {
		const definition = exportStores[e.sessionId][e.exportId].getState().definition;

		return { export: e, definition };
	}));

	// create a data structure to store the elements within groups
	const elementGroups: {
		[key: string]: {
			group: { id: string, name: string }
			elements: JSX.Element[],
		}
	} = {};

	// sort the parameters
	// const sortedParams = Object.values(parameters).map((ps) => ps((state) => state));
	sortedParamsAndExports.sort((a, b) => (a.definition.order || Infinity) - (b.definition.order || Infinity));

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
						disableIfDirty={disableIfDirty} />
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
					style={{ background: theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0] }}
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
