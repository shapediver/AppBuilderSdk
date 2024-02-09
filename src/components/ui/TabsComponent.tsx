import React from "react";
import { useIsMobile } from "hooks/ui/useIsMobile";
import classes from "./TabsComponent.module.css";
import { Tabs } from "@mantine/core";
import Icon from "./Icon";
import { IconType } from "types/shapediver/icons";

interface PropsTab {
	name: string,
	icon?: IconType,
	children: JSX.Element[],
}

export interface ITabsComponentProps {
	defaultValue: string,
	tabs: PropsTab[],
}


export default function TabsComponent({defaultValue, tabs}: ITabsComponentProps) {

	const isMobile = useIsMobile();

	return tabs.length === 0 ? <></> : <Tabs defaultValue={defaultValue} className={classes.tabs}>
		<Tabs.List>
			{
				tabs.map((tab, index) => <Tabs.Tab 
					key={index} 
					value={tab.name} 
					leftSection={<Icon type={tab.icon} />} 
				>
					{tab.name}
				</Tabs.Tab>)
			}
		</Tabs.List>
		{
			tabs.map((tab, index) =>
				<Tabs.Panel key={index} value={tab.name} pt={isMobile ? "" : "xs"}>
					{tab.children}
				</Tabs.Panel>
			)
		}
	</Tabs>;

}
