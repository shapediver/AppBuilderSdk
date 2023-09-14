import React, { JSX } from "react";
import { IUseViewportProps, useViewport } from "../../hooks/useViewport";

/**
 * Functional component that creates a canvas in which a viewport with the specified properties is loaded.
 *
 * @returns
 */
export default function ViewportComponent(props: IUseViewportProps): JSX.Element {
	const { canvasRef } = useViewport(props);

	return (<canvas ref={canvasRef} />);
}
