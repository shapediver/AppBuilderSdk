import React from "react";
import { IWebAppWidgetPropsImage } from "types/shapediver/webapp";
import ImageWidgetComponent from "components/shapediver/ui/ImageWidgetComponent";
import WebAppImageExportWidgetComponent from "./WebAppImageExportWidgetComponent";

interface Props {
	imageProps: IWebAppWidgetPropsImage
	sessionId: string
	version: string
}

export default function WebAppImageWidgetComponent({imageProps, sessionId, version}: Props) {
	
	if (imageProps.href) {
		return <ImageWidgetComponent src={imageProps.href} />;
	}
	else if (imageProps.export) {
		return <WebAppImageExportWidgetComponent sessionId={sessionId} exportId={imageProps.export} version={version} />;
	}

	return <></>;
}
