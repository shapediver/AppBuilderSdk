import React from "react";
import { IWebAppWidgetPropsImage } from "types/shapediver/webapp";
import ImageWidgetComponent from "components/shapediver/ui/ImageWidgetComponent";
import WebAppImageExportWidgetComponent from "./WebAppImageExportWidgetComponent";

interface Props extends IWebAppWidgetPropsImage {
	/** 
	 * Default session id to use for parameter and export references that do 
	 * not specify a session id.
	 */
	sessionId: string
}

export default function WebAppImageWidgetComponent({href, export: exportRef, sessionId}: Props) {

	if (href) {
		return <ImageWidgetComponent src={href} />;
	}
	else if (exportRef) {
		return <WebAppImageExportWidgetComponent sessionId={sessionId} exportId={exportRef.name} />;
	}

	return <></>;
}
