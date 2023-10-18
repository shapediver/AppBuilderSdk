import React, { JSX } from "react";
import { useViewport } from "hooks/useViewport";
import { ViewportCreateDto } from "types/store/shapediverStoreViewer";


interface Props extends ViewportCreateDto {
	children?: React.ReactNode;
}
/**
 * Functional component that creates a canvas in which a viewport with the specified properties is loaded.
 *
 * @returns
 */
export default function ViewportComponent(props: Props): JSX.Element {
	const { children = <></> } = props;
	const { canvasRef } = useViewport(props);

	return (
		<div style={{
			position: "relative",
			width: "100%",
			height: "100%",
			overflow: "hidden"
		}}>
			<canvas ref={canvasRef} />
			{children}
		</div>
	);
}
