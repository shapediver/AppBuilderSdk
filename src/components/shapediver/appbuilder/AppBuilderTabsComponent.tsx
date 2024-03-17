import React, { useMemo } from "react";
import { AppBuilderContainerTypeEnum, IAppBuilderTab } from "types/shapediver/appbuilder";
import AppBuilderWidgetsComponent from "./AppBuilderWidgetsComponent";
import TabsComponent, { ITabsComponentProps } from "components/ui/TabsComponent";

interface Props {
	/** 
	 * Default session id to use for parameter and export references that do 
	 * not specify a session id.
	 */
	sessionId: string,
	/** The tabs to display. */
	tabs: IAppBuilderTab[] | undefined,
	/** Type of container. */
	containerType: AppBuilderContainerTypeEnum,
}

export default function AppBuilderTabsComponent({ sessionId, tabs, containerType }: Props) {

	if (!tabs || tabs.length === 0) {
		return <></>;
	}

	const tabProps: ITabsComponentProps = useMemo(() => { 
		return {
			defaultValue: tabs[0].name,
			tabs: tabs.map(tab => {
				return {
					name: tab.name,
					icon: tab.icon,
					children: [
						<AppBuilderWidgetsComponent key={0} sessionId={sessionId} widgets={tab.widgets} containerType={containerType} />
					]
				};
			})
		};
	}, [sessionId, tabs, containerType]);

	return <TabsComponent {...tabProps} />;

}
