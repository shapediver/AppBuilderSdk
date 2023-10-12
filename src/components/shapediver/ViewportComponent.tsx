import React, { JSX } from "react";
import { useViewport } from "hooks/useViewport";
import { ViewportCreateDto } from "types/store/shapediverStoreViewer";

/**
 * Functional component that creates a canvas in which a viewport with the specified properties is loaded.
 *
 * @returns
 */
export default function ViewportComponent(props: ViewportCreateDto): JSX.Element {
	const { canvasRef } = useViewport(props);

	return (
		<div style={{
			position: "relative",
			width: "100%",
			height: "100%",
			overflow: "hidden"
		}}>
			<canvas ref={canvasRef} />
		</div>
	);
}
