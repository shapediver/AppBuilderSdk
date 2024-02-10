import React from "react";
import { IWebAppContainer } from "types/shapediver/webapp";
import WebAppWidgetsComponent from "./WebAppWidgetsComponent";
import WebAppTabsComponent from "./WebAppTabsComponent";

interface Props extends IWebAppContainer {
	/** 
	 * Default session id to use for parameter and export references that do 
	 * not specify a session id.
	 */
	sessionId: string,
}

export default function WebAppContainerComponent({ sessionId, widgets, tabs }: Props) {

	return <>
		<WebAppTabsComponent sessionId={sessionId} tabs={tabs} />
		<WebAppWidgetsComponent sessionId={sessionId} widgets={widgets} />
	</>;

}
