import { EXPORT_TYPE } from "@shapediver/viewer";
import { useExport } from "hooks/shapediver/parameters/useExport";
import React, { useEffect, useRef, useState } from "react";
import AppBuilderImage from "./AppBuilderImage";
import { AppBuilderContainerTypeEnum } from "types/shapediver/appbuilder";
import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";

interface Props {
	/**
	 * Default session id to use for parameter and export references that do
	 * not specify a session id.
	 */
	sessionId: string
	/** Id or name or displayname of the export to get the image from. */
	exportId: string
	/** Type of container */
	containerType?: AppBuilderContainerTypeEnum
}

/**
 * TODO refactor this such that a single export call is used to get all the images
 * @param param0
 * @returns
 */
export default function AppBuilderImageExportWidgetComponent({sessionId, exportId, containerType, ...rest}: Props) {

	const { definition, actions } = useExport(sessionId, exportId);

	const promiseChain = useRef(Promise.resolve());
	const [ href, setHref ] = useState<string | undefined>(undefined);

	const { registerDefaultExport, deregisterDefaultExport } = useShapeDiverStoreParameters();
	useEffect(() => {
		registerDefaultExport(sessionId, definition.id);

		return () => deregisterDefaultExport(sessionId, definition.id);
	}, [sessionId, definition]);

	const responses = useShapeDiverStoreParameters(state => state.defaultExportResponses[sessionId]);

	useEffect(() => {
		if (responses && responses[definition.id]) {
			const response = responses[definition.id];
			if (response.content && response.content[0] && response.content[0].href) {
				setHref(response.content[0].href);
			}
			else {
				setHref(undefined);
			}
		}
		else {
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
				else {
					setHref(undefined);
				}
			});
		}

	}, [responses, definition]);

	if (href)
		return <AppBuilderImage src={href} containerType={containerType} { ...rest } />;
	else
		return <></>;
}
