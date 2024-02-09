import { EXPORT_TYPE } from "@shapediver/viewer";
import { useExport } from "hooks/shapediver/useExport";
import React, { useEffect, useRef, useState } from "react";
import ImageWidgetComponent from "../ui/ImageWidgetComponent";

interface Props {
	sessionId: string
	exportId: string
	version: string
}

/**
 * TODO refactor this such that a single export call is used to get all the images
 * @param param0 
 * @returns 
 */
export default function WebAppImageExportWidgetComponent({sessionId, exportId, version}: Props) {
	
	const { definition, actions } = useExport(sessionId, exportId);

	const promiseChain = useRef(Promise.resolve());
	const [ href, setHref ] = useState<string | undefined>(undefined);

	useEffect(() => {
		promiseChain.current = promiseChain.current.then(async () => {

			if (definition.type !== EXPORT_TYPE.DOWNLOAD)
				return;

			// request the export
			const response = await actions.request();

			if ( response.content &&
				response.content[0] &&
				response.content[0].href
			) {
				setHref(response.content[0].href);
			}
		});
		
	}, [version]);

	if (href)
		return <ImageWidgetComponent src={href} />;
	else
		return <></>;
}
