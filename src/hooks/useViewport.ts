import { useEffect, useRef } from "react";
import { useShapeDiverStoreViewer } from "store/shapediverStoreViewer";
import { ViewportCreateDto } from "types/store/shapediverStoreViewer";
import { useMantineTheme } from "@mantine/core";

/**
 * Hook for creating a viewport of the ShapeDiver 3D Viewer.
 * Typically, you want to directly use the ViewportComponent instead
 * of calling this hook yourself.
 * @see {@link useShapeDiverStoreViewer} to access the API of the viewport.
 * @param props
 * @returns
 */
export function useViewport(props: ViewportCreateDto) {
	const { createViewport, closeViewport } = useShapeDiverStoreViewer();
	const promiseChain = useRef(Promise.resolve());
	const canvasRef = useRef(null);

	useEffect(() => {
		promiseChain.current = promiseChain.current.then(async () => {
			const viewportApi = await createViewport({
				canvas: canvasRef.current!,
				...props
			});
			if (viewportApi && props.showStatistics)
				viewportApi.showStatistics = true;
		});

		return () => {
			promiseChain.current = promiseChain.current.then(() => closeViewport(props.id));
		};
	}, [props.id]);

	return {
		canvasRef
	};
}

export function useBranding() {
	const theme = useMantineTheme();

	return {
		branding: {
			backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0],
			logo: theme.colorScheme === "dark" ? undefined : "https://viewer.shapediver.com/v3/graphics/logo_animated_breath_inverted.svg"
		}
	};
}
