import { useEffect, useRef } from "react";
import { useShapediverStoreViewer } from "store/shapediverStoreViewer";
import { ViewportCreateDto } from "types/store/shapediverStoreViewer";

export function useViewport(props: ViewportCreateDto) {
	const { createViewport, closeViewport } = useShapediverStoreViewer();
	const promiseChain = useRef(Promise.resolve());
	const canvasRef = useRef(null);

	useEffect(() => {
		promiseChain.current = promiseChain.current.then(() => {
			createViewport({
				canvas: canvasRef.current!,
				...props
			});
		});

		return () => {
			promiseChain.current = promiseChain.current.then(() => closeViewport(props.id));
		};
	}, [props.id]);

	return {
		canvasRef
	};
}
