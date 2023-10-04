import React, { JSX } from "react";
import { Divider, Loader, MediaQuery, ScrollArea } from "@mantine/core";
import ExportButtonComponent from "components/shapediver/exports/ExportButtonComponent";
import { IExports } from "types/store/shapediverStoreUI";

interface Props {
    exports: IExports
}

export default function ExportUiComponent({ exports }: Props): JSX.Element {
	const elements: JSX.Element[] = [];

	// sort the parameters
	const sortedExports = Object.values(exports);

	// as long as there are no parameters, show a loader
	if (sortedExports.length === 0) {
		return(<Loader style={{ width: "100%" }} mt="xl" size="xl" variant="dots" />);
	}

	// loop through the exports and store the created elements
	for (let i = 0; i < sortedExports.length; i++) {
		const exp = sortedExports[i];

		// if an export is hidden, skip it
		if (exp.definition.hidden) continue;
		elements.push(<div key={exp.definition.id}><ExportButtonComponent exp={exp} /></div>);
		// create dividers between the elements
		if (i !== sortedExports.length - 1) elements.push(<Divider key={exp.definition.id + "_divider"} my="sm" />);
	}

	return (
		<MediaQuery smallerThan="sm" styles={{
			// minus tab height (34) and two times margin (2 x 10)
			height: "calc(300px - 54px)"
		}}>
			<ScrollArea>
				{elements}
			</ScrollArea>
		</MediaQuery>
	);
}
