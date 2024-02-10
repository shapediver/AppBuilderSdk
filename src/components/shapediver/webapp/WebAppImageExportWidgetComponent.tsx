import { EXPORT_TYPE } from "@shapediver/viewer";
import { useExport } from "hooks/shapediver/useExport";
import React, { useEffect, useRef, useState } from "react";
import ImageWidgetComponent from "../ui/ImageWidgetComponent";

interface Props {
	/** 
	 * Default session id to use for parameter and export references that do 
	 * not specify a session id.
	 */
	sessionId: string
	/** Id or name or displayname of the export to get the image from. */
	exportId: string
}

/**
 * TODO refactor this such that a single export call is used to get all the images
 * @param param0 
 * @returns 
 */
export default function WebAppImageExportWidgetComponent({sessionId, exportId}: Props) {
	
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
		
	}, [{}]);

	if (href)
		return <ImageWidgetComponent src={href} />;
	else
		return <></>;
}
