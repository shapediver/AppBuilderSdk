import React from "react";
import { IWebAppWidget, isAccordionWidget, isImageWidget, isTextWidget } from "types/shapediver/webapp";
import WebAppTextWidgetComponent from "./WebAppTextWidgetComponent";
import WebAppImageWidgetComponent from "./WebAppImageWidgetComponent";
import WebAppAccordionWidgetComponent from "./WebAppAccordionWidgetComponent";

interface Props {
	/** 
	 * Default session id to use for parameter and export references that do 
	 * not specify a session id.
	 */
	sessionId: string,
	/** TODO drop this */
	version: string,
	/** The widgets to display. */
	widgets: IWebAppWidget[] | undefined
}

export default function WebAppWidgetsComponent({ sessionId, version, widgets }: Props) {

	if (!widgets) {
		return <></>;
	}

	return <>
		{ widgets.map((w, i) => {
			if (isTextWidget(w))
				return <WebAppTextWidgetComponent key={i} {...w.props} />;
			else if (isImageWidget(w))
				return <WebAppImageWidgetComponent key={i} sessionId={sessionId} version={version} {...w.props} />;
			else if (isAccordionWidget(w))
				return <WebAppAccordionWidgetComponent key={i} sessionId={sessionId} {...w.props} />;
			else
				return <></>;
		})}
	</>;

}
