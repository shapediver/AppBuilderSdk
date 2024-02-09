import React from "react";
import { IWebAppContainer } from "types/shapediver/webapp";
import WebAppWidgetsComponent from "./WebAppWidgetsComponent";
import WebAppTabsComponent from "./WebAppTabsComponent";

interface Props extends IWebAppContainer {
	sessionId: string,
	version: string
}

export default function WebAppContainerComponent({ sessionId, version, widgets, tabs }: Props) {

	return <>
		<WebAppTabsComponent sessionId={sessionId} version={version} tabs={tabs} />
		<WebAppWidgetsComponent sessionId={sessionId} version={version} widgets={widgets} />
	</>;

}
