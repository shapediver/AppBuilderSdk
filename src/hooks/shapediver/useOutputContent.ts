import { IOutputApi, ShapeDiverResponseOutputContent } from "@shapediver/viewer";
import * as SDV from "@shapediver/viewer";
import { useEffect, useState } from "react";
import { useOutput } from "./useOutput";

/**
 * Hook providing access to outputs by id or name, 
 * and providing the resulting content of the output.
 * 
 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
 * 
 * Makes use of {@link useOutput}.
 * 
 * @param sessionId 
 * @param outputIdOrName 
 * @returns 
 */
export function useOutputContent(sessionId: string, outputIdOrName: string) : {
	/**
	 * API of the output
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html
	 */
	outputApi: IOutputApi | undefined,
	/**
	 * Scene tree node of the output
	 * @see https://viewer.shapediver.com/v3/latest/api/interfaces/IOutputApi.html#node
	 */
	outputContent: ShapeDiverResponseOutputContent[] | undefined
} {
	const { outputApi } = useOutput(sessionId, outputIdOrName);

	const [content, setContent] = useState<ShapeDiverResponseOutputContent[] | undefined>(outputApi?.content);

	// register an event handler and listen for output updates
	const [ initialContentSet, setInitialContent ] = useState(false);
	useEffect(() => {
		const token = SDV.addListener(SDV.EVENTTYPE_OUTPUT.OUTPUT_UPDATED, (e) => {
			const event = (e as SDV.IOutputEvent);
			if (event.outputId !== outputApi?.id)
				return;
			if (content !== outputApi?.content)
				setContent(outputApi?.content);
		});

		if (!initialContentSet && outputApi?.content) {
			if (content !== outputApi.content)
				setContent(outputApi.content);
			setInitialContent(true);
		}

		return () => {
			SDV.removeListener(token);
		};
	}, [outputApi, initialContentSet]);

	return {
		outputApi,
		outputContent: content
	};
}
