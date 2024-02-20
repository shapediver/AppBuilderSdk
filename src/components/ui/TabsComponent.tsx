import React from "react";
import classes from "./TabsComponent.module.css";
import { Stack, Tabs } from "@mantine/core";
import Icon from "./Icon";
import { IconType } from "types/shapediver/icons";

interface PropsTab {
	/** Name (value) of tab. */
	name: string,
	/** Optional icon of tab. */
	icon?: IconType,
	/** Children of tab. */
	children: JSX.Element[],
}

export interface ITabsComponentProps {
	/** Value of default tab. */
	defaultValue: string,
	/** The tabs. */
	tabs: PropsTab[],
}


export default function TabsComponent({defaultValue, tabs}: ITabsComponentProps) {

	return tabs.length === 0 ? <></> : <Tabs defaultValue={defaultValue}>
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
				<Tabs.Panel key={index} value={tab.name}>
					<Stack>
						{tab.children}
					</Stack>
				</Tabs.Panel>
			)
		}
	</Tabs>;

}
