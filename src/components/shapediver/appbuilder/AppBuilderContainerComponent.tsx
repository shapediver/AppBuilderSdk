import React from "react";
import { IAppBuilderContainer } from "types/shapediver/appbuilder";
import AppBuilderWidgetsComponent from "./AppBuilderWidgetsComponent";
import AppBuilderTabsComponent from "./AppBuilderTabsComponent";

interface Props extends IAppBuilderContainer {
	/** 
	 * Default session id to use for parameter and export references that do 
	 * not specify a session id.
	 */
	sessionId: string,
}

export default function AppBuilderContainerComponent({ sessionId, widgets, tabs }: Props) {

	return <>
		<AppBuilderTabsComponent sessionId={sessionId} tabs={tabs} />
		<AppBuilderWidgetsComponent sessionId={sessionId} widgets={widgets} />
	</>;

}
