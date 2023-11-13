import React from "react";
import { useViewport } from "hooks/useViewport";
import { ViewportCreateDto } from "types/store/shapediverStoreViewer";
import classes from "./ViewportComponent.module.css";


interface Props extends ViewportCreateDto {
	children?: React.ReactNode;
}
/**
 * Functional component that creates a canvas in which a viewport with the specified properties is loaded.
 *
 * @returns
 */
export default function ViewportComponent(props: Props) {
	const { children = <></> } = props;
	const { canvasRef } = useViewport(props);

	return (
		<div className={classes.container}>
			<canvas ref={canvasRef} />
			{children}
		</div>
	);
}
