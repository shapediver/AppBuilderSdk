import React from "react";
import { IAppBuilderWidgetPropsImage } from "types/shapediver/appbuilder";
import AppBuilderImage from "components/shapediver/appbuilder/AppBuilderImage";
import AppBuilderImageExportWidgetComponent from "./AppBuilderImageExportWidgetComponent";

interface Props extends IAppBuilderWidgetPropsImage {
	/** 
	 * Default session id to use for parameter and export references that do 
	 * not specify a session id.
	 */
	sessionId: string
}

export default function AppBuilderImageWidgetComponent({href, export: exportRef, sessionId, containerType}: Props) {

	if (href) {
		return <AppBuilderImage src={href} containerType={containerType} />;
	}
	else if (exportRef) {
		return <AppBuilderImageExportWidgetComponent sessionId={sessionId} exportId={exportRef.name} />;
	}

	return <></>;
}
