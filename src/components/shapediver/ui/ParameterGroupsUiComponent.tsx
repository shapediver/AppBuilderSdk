import React, { JSX } from "react";
import { Accordion, Divider, Loader, MediaQuery, ScrollArea, useMantineTheme } from "@mantine/core";
import { ISdReactParamOrExport } from "types/shapediver/common";
import { ISdReactParameter } from "types/shapediver/parameter";
import { getParameterComponent } from "types/components/shapediver/parameter";

/**
 * Functional component that creates a wrapper for parameters group.
 *
 * @returns
 */

interface Props {
	parameters: ISdReactParamOrExport[],
}

export default function ParameterGroupsUiComponent(props: Props): JSX.Element {
	const theme = useMantineTheme();
	const sortedParams = [ ...props.parameters ];

	// create a data structure to store the elements within groups
	const elementGroups: {
		[key: string]: {
			group: { id: string, name: string }
			elements: JSX.Element[],
		}
	} = {};

	// sort the parameters
	// const sortedParams = Object.values(parameters).map((ps) => ps((state) => state));
	sortedParams.sort((a, b) => (a.definition.order || Infinity) - (b.definition.order || Infinity));

	// as long as there are no parameters, show a loader
	if (sortedParams.length === 0) {
		return(<Loader style={{ width: "100%" }} mt="xl" size="xl" variant="dots" />);
	}

	// loop through the parameters and store the created elements in the elementGroups
	for (let i = 0; i < sortedParams.length; i++) {
		const param = sortedParams[i] as ISdReactParameter<any>;

		// if a parameter is hidden, skip it
		if (param.definition.hidden) continue;

		// read out the group or specify a new one if none has been provided
		const group = param.definition.group || { id: "default", name: "Default Group" };
		if (!elementGroups[group.id]) {
			elementGroups[group.id] = {
				group,
				elements: []
			};
		}

		const ParameterComponent = getParameterComponent(param);

		// Get the element for the parameter and add it to the group
		elementGroups[group.id].elements.push(<div key={param.definition.id}><ParameterComponent definition={param.definition} state={param.state} actions={param.actions} /></div>);
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

	return <MediaQuery smallerThan="sm" styles={{
		// minus tab height (34) and two times margin (2 x 10)
		height: "calc(300px - 54px)"
	}}>
		<ScrollArea type="auto">
			<Accordion variant="contained" radius="md">
				{ elements }
			</Accordion>
		</ScrollArea>
	</MediaQuery>;
}
