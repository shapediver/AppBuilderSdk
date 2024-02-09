import React from "react";
import { IWebAppTab } from "types/shapediver/webapp";
import WebAppWidgetsComponent from "./WebAppWidgetsComponent";
import TabsComponent, { ITabsComponentProps } from "components/ui/TabsComponent";

interface Props {
	sessionId: string,
	version: string,
	tabs: IWebAppTab[] | undefined
}

export default function WebAppTabsComponent({ sessionId, version, tabs }: Props) {

	if (!tabs || tabs.length === 0) {
		return <></>;
	}

	const tabProps: ITabsComponentProps = {
		defaultValue: tabs[0].name,
		tabs: tabs.map(tab => {
			return {
				name: tab.name,
				children: [
					<WebAppWidgetsComponent key={0} sessionId={sessionId} version={version} widgets={tab.widgets} />
				]
			};
		})
	};

	return <TabsComponent {...tabProps} />;

}
