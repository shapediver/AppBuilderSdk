import React from "react";
import { IAppBuilderWidgetPropsImage } from "types/shapediver/webapp";
import ImageWidgetComponent from "components/shapediver/ui/ImageWidgetComponent";
import AppBuilderImageExportWidgetComponent from "./WebAppImageExportWidgetComponent";

interface Props extends IAppBuilderWidgetPropsImage {
	/** 
	 * Default session id to use for parameter and export references that do 
	 * not specify a session id.
	 */
	sessionId: string
}

export default function AppBuilderImageWidgetComponent({href, export: exportRef, sessionId}: Props) {

	if (href) {
		return <ImageWidgetComponent src={href} />;
	}
	else if (exportRef) {
		return <AppBuilderImageExportWidgetComponent sessionId={sessionId} exportId={exportRef.name} />;
	}

	return <></>;
}
