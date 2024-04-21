import React from "react";
import { IAppBuilderWidget, isAccordionWidget, isImageWidget, isOptimizerWidget, isTextWidget } from "types/shapediver/appbuilder";
import AppBuilderTextWidgetComponent from "./AppBuilderTextWidgetComponent";
import AppBuilderImageWidgetComponent from "./AppBuilderImageWidgetComponent";
import AppBuilderAccordionWidgetComponent from "./AppBuilderAccordionWidgetComponent";
import AppBuilderOptimizerWidgetComponent from "./AppBuilderOptimizerWidgetComponent";

interface Props {
	/** 
	 * Default session id to use for parameter and export references that do 
	 * not specify a session id.
	 */
	sessionId: string,
	/** The widgets to display. */
	widgets: IAppBuilderWidget[] | undefined,
}

export default function AppBuilderWidgetsComponent({ sessionId, widgets }: Props) {

	if (!widgets) {
		return <></>;
	}

	return <>
		{ widgets.map((w, i) => {
			if (isTextWidget(w))
				return <AppBuilderTextWidgetComponent key={i} {...w.props} />;
			else if (isImageWidget(w))
				return <AppBuilderImageWidgetComponent key={i} sessionId={sessionId} {...w.props} />;
			else if (isAccordionWidget(w))
				return <AppBuilderAccordionWidgetComponent key={i} sessionId={sessionId} {...w.props} />;
			else if (isOptimizerWidget(w))
				return <AppBuilderOptimizerWidgetComponent key={i} sessionId={sessionId} {...w.props} />;
			else
				return null;
		})}
	</>;

}
