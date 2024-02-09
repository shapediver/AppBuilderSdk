import React from "react";
import { IWebAppTab } from "types/shapediver/webapp";
import classes from "./WebAppTabsComponent.module.css";
import { Tabs } from "@mantine/core";
import WebAppWidgetsComponent from "./WebAppWidgetsComponent";
import ParametersAndExportsAccordionTab from "../ui/ParametersAndExportsAccordionTab";
import { useIsMobile } from "hooks/ui/useIsMobile";

interface Props {
	sessionId: string,
	version: string,
	tabs: IWebAppTab[] | undefined
}

export default function WebAppTabsComponent({ sessionId, version, tabs }: Props) {

	const isMobile = useIsMobile();

	if (!tabs || tabs.length === 0) {
		return <></>;
	}

	return <Tabs defaultValue={tabs[0].name} className={classes.tabs}>
		<Tabs.List>
			{
				// TODO tab.icon
				tabs.map((tab, index) => <Tabs.Tab key={index} value={tab.name}>{tab.name}</Tabs.Tab>)
			}
		</Tabs.List>
		{
			tabs.map((tab, index) => 
				<ParametersAndExportsAccordionTab key={index} value={tab.name} pt={isMobile ? "" : "xs"}>
					<WebAppWidgetsComponent key={index} sessionId={sessionId} version={version} widgets={tab.widgets} />
				</ParametersAndExportsAccordionTab>
			)
		}
	</Tabs>;

}
