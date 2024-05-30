import { EXPORT_TYPE } from "@shapediver/viewer";
import { useExport } from "hooks/shapediver/parameters/useExport";
import React, { useCallback, useEffect, useRef, useState } from "react";
import AppBuilderImage from "./AppBuilderImage";
import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";

interface Props {
	/**
	 * Default session id to use for parameter and export references that do
	 * not specify a session id.
	 */
	sessionId: string
	/** Id or name or displayname of the export to get the image from. */
	exportId: string
}

export default function AppBuilderImageExportWidgetComponent(props: Props) {

	const { sessionId, ...rest } = props;
	const { definition, actions } = useExport(props);

	const promiseChain = useRef(Promise.resolve());
	const objectUrl = useRef<string | undefined>(undefined);
	const [ imageSrc, setImageSrc ] = useState<string | undefined>(undefined);

	/**
	 * Create an object URL for the given href and set it as the image source.
	 */
	const setImageSrcCb = useCallback((href: string) => {
		promiseChain.current = promiseChain.current.then(async () => {
			if (objectUrl.current) {
				URL.revokeObjectURL(objectUrl.current);
				objectUrl.current = undefined;
			}
			if (href) {
				const res = await actions.fetch(href);
				const blob = await res.blob();
				objectUrl.current = URL.createObjectURL(blob);
			}
			setImageSrc(objectUrl.current);
		});
	}, [setImageSrc]);

	// Register the export to be requested on every parameter change.
	const { registerDefaultExport, deregisterDefaultExport } = useShapeDiverStoreParameters();
	useEffect(() => {
		registerDefaultExport(sessionId, definition.id);

		return () => deregisterDefaultExport(sessionId, definition.id);
	}, [sessionId, definition]);

	// Get responses to exports which were requested by default.
	const responses = useShapeDiverStoreParameters(state => state.defaultExportResponses[sessionId]);

	useEffect(() => {
		if (responses && responses[definition.id]) {
			const response = responses[definition.id];
			if (response.content && response.content[0] && response.content[0].href) {
				const href = response.content[0].href;
				setImageSrcCb(href);
			}
			else {
				setImageSrc(undefined);
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
					const href = response.content[0].href;
					setImageSrcCb(href);
				}
				else {
					setImageSrc(undefined);
				}
			});
		}

	}, [responses, definition]);

	if (imageSrc)
		return <AppBuilderImage src={imageSrc} { ...rest } />;
	else
		return <></>;
}
