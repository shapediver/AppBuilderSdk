import React from "react";
import { AppBuilderContainerTypeEnum, IAppBuilderContainer } from "types/shapediver/appbuilder";
import AppBuilderWidgetsComponent from "./AppBuilderWidgetsComponent";
import AppBuilderTabsComponent from "./AppBuilderTabsComponent";

interface Props extends IAppBuilderContainer {
	/** 
	 * Default session id to use for parameter and export references that do 
	 * not specify a session id.
	 */
	sessionId: string,
}

export default function AppBuilderContainerComponent({ name, sessionId, widgets, tabs }: Props) {

	const containerType = name === "top" || name === "bottom" ? AppBuilderContainerTypeEnum.Row : AppBuilderContainerTypeEnum.Column;

	return <>
		<AppBuilderTabsComponent sessionId={sessionId} tabs={tabs} containerType={containerType} />
		<AppBuilderWidgetsComponent sessionId={sessionId} widgets={widgets} containerType={containerType} />
	</>;

}
