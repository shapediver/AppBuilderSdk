import React from "react";
import { AppBuilderContainerTypeEnum, IAppBuilderWidget, isAccordionWidget, isImageWidget, isTextWidget } from "types/shapediver/appbuilder";
import AppBuilderTextWidgetComponent from "./AppBuilderTextWidgetComponent";
import AppBuilderImageWidgetComponent from "./AppBuilderImageWidgetComponent";
import AppBuilderAccordionWidgetComponent from "./AppBuilderAccordionWidgetComponent";

interface Props {
	/** 
	 * Default session id to use for parameter and export references that do 
	 * not specify a session id.
	 */
	sessionId: string,
	/** The widgets to display. */
	widgets: IAppBuilderWidget[] | undefined,
	/** Type of container. */
	containerType: AppBuilderContainerTypeEnum,
}

export default function AppBuilderWidgetsComponent({ sessionId, widgets, containerType }: Props) {

	if (!widgets) {
		return <></>;
	}

	return <>
		{ widgets.map((w, i) => {
			if (isTextWidget(w))
				return <AppBuilderTextWidgetComponent key={i} {...w.props} containerType={containerType} />;
			else if (isImageWidget(w))
				return <AppBuilderImageWidgetComponent key={i} sessionId={sessionId} {...w.props} containerType={containerType} />;
			else if (isAccordionWidget(w))
				return <AppBuilderAccordionWidgetComponent key={i} sessionId={sessionId} {...w.props} containerType={containerType} />;
			else
				return null;
		})}
	</>;

}
