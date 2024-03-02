import React from "react";
import { useViewport } from "hooks/shapediver/viewer/useViewport";
import { ViewportCreateDto } from "types/store/shapediverStoreViewer";
import classes from "./ViewportComponent.module.css";
import { useComputedColorScheme, useProps } from "@mantine/core";
import { BUSY_MODE_DISPLAY, SPINNER_POSITIONING } from "@shapediver/viewer";


interface Props extends ViewportCreateDto {
	children?: React.ReactNode;
	className?: string;
}

interface ViewportBranding {
	logo?: string | null,
	backgroundColor?: string,
	busyModeSpinner?: string,
	busyModeDisplay?: BUSY_MODE_DISPLAY,
	spinnerPositioning?: SPINNER_POSITIONING	
}

interface ViewportBrandingProps {
	dark: ViewportBranding;
	light: ViewportBranding;
}

/**
 * Functional component that creates a canvas in which a viewport with the specified properties is loaded.
 *
 * @returns
 */
export default function ViewportComponent(props: Props) {
	const { children = <></>, className = "", ...rest } = props;
	const _props = useProps("ViewportComponent", {}, rest);

	const brandingProps = useProps("ViewportBranding", {}, {}) as ViewportBrandingProps;
	const scheme = useComputedColorScheme();
	if (!_props.branding) 
		_props.branding = brandingProps[scheme];

	const { canvasRef } = useViewport(_props);

	return (
		<div className={`${classes.container} ${className}`}>
			<canvas ref={canvasRef} />
			{children}
		</div>
	);
}
