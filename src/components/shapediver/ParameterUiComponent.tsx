import React, { JSX } from "react";
import { PARAMETER_TYPE } from "@shapediver/viewer";
import { Accordion, Divider, Loader, MediaQuery, ScrollArea, useMantineTheme } from "@mantine/core";
import ParameterSliderComponent from "components/shapediver/parameter/ParameterSliderComponent";
import ParameterBooleanComponent from "components/shapediver/parameter/ParameterBooleanComponent";
import ParameterStringComponent from "components/shapediver/parameter/ParameterStringComponent";
import ParameterColorComponent from "components/shapediver/parameter/ParameterColorComponent";
import ParameterSelectComponent from "components/shapediver/parameter/ParameterSelectComponent";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import ParameterFileInputComponent from "components/shapediver/parameter/ParameterFileInputComponent";
import { IParameters } from "types/store/shapediverStoreUI";
import { ISdReactParameter } from "types/shapediver/parameter";

interface Props {
    parameters: IParameters
	// TODO SS-7087 extend this by
	// exports: IExports
}

/**
 * Functional component that creates a parameter UI for a list of parameters.
 *
 * Parameters that are specified as "hidden" will be skipped.
 *
 * The grouping is done via the "group" property and the order of the elements is done via the "order" property.
 *
 * @returns
 */
export default function ParameterUiComponent({ parameters }: Props): JSX.Element {
	const theme = useMantineTheme();
	
	const parameterComponentsMap = {
		[PARAMETER_TYPE.INT]: ParameterSliderComponent,
		[PARAMETER_TYPE.FLOAT]: ParameterSliderComponent,
		[PARAMETER_TYPE.EVEN]: ParameterSliderComponent,
		[PARAMETER_TYPE.ODD]: ParameterSliderComponent,
		[PARAMETER_TYPE.BOOL]: ParameterBooleanComponent,
		[PARAMETER_TYPE.STRING]: ParameterStringComponent,
		[PARAMETER_TYPE.STRINGLIST]: ParameterSelectComponent,
		[PARAMETER_TYPE.COLOR]: ParameterColorComponent,
		[PARAMETER_TYPE.FILE]: ParameterFileInputComponent,
	};

	// TODO SS-7087 use "store of parameter stores" to get parameters and exports by id

	// create a data structure to store the elements within groups
	const elementGroups: {
			[key: string]: {
				group: { id: string, name: string }
				elements: JSX.Element[],
			}
		} = {};

	// sort the parameters
	const sortedParams = Object.values(parameters);
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

		const type = param.definition.type as keyof typeof parameterComponentsMap;
		const ParameterComponent = parameterComponentsMap[type] || ParameterLabelComponent;

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

	// finally, set the element
	return(
		<MediaQuery smallerThan="sm" styles={{
			// minus tab height (34) and two times margin (2 x 10)
			height: "calc(300px - 54px)"
		}}>
			<ScrollArea type="auto">
				<Accordion variant="contained" radius="md">
					{elements}
				</Accordion>
			</ScrollArea>
		</MediaQuery>
	);
	
}
