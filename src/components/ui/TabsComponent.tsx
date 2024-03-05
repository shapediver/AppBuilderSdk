import React, { ReactElement, useEffect, useState } from "react";
import { Stack, Tabs } from "@mantine/core";
import Icon from "./Icon";
import { IconType } from "types/shapediver/icons";

interface PropsTab {
	/** Name (value) of tab. */
	name: string,
	/** Optional icon of tab. */
	icon?: IconType,
	/** Children of tab. */
	children: ReactElement[],
}

export interface ITabsComponentProps {
	/** Value of default tab. */
	defaultValue: string,
	/** The tabs. */
	tabs: PropsTab[],
}


export default function TabsComponent({defaultValue, tabs}: ITabsComponentProps) {

	const [activeTab, setActiveTab] = useState<string | null>(defaultValue);
	const tabNames = tabs.map(tab => tab.name);

	useEffect(() => {
		if (!activeTab || !tabNames.includes(activeTab)) {
			if (tabNames.includes(defaultValue)) {
				setActiveTab(defaultValue);
			}
			else {
				setActiveTab(tabNames[0]);
			}
		}
	}, [tabNames.join(""), defaultValue]);

	return tabs.length === 0 ? <></> : <Tabs value={activeTab} onChange={setActiveTab}>
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
