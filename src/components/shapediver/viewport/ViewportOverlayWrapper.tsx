import { useProps } from "@mantine/core";
import React from "react";

export enum ViewportOverlayPositionEnum {
	TOP_LEFT = "top-left",
	TOP_RIGHT = "top-right",
	BOTTOM_LEFT = "bottom-left",
	BOTTOM_RIGHT = "bottom-right",
}

interface Props {
	children?: React.ReactNode;
}

interface StyleProps {
	position: ViewportOverlayPositionEnum;
}

const defaultStyleProps: StyleProps = {
	position: ViewportOverlayPositionEnum.TOP_RIGHT,
};

const positionStyles = {
	[ViewportOverlayPositionEnum.TOP_LEFT]: {
		top: "0",
		left: "0",
	},
	[ViewportOverlayPositionEnum.TOP_RIGHT]: {
		top: "0",
		right: "0",
	},
	[ViewportOverlayPositionEnum.BOTTOM_LEFT]: {
		bottom: "0",
		left: "0",
	},
	[ViewportOverlayPositionEnum.BOTTOM_RIGHT]: {
		bottom: "0",
		right: "0",
	},
};

export default function ViewportOverlayWrapper(props: Props & Partial<StyleProps>) {

	const { children = <></>, ...rest } = props;
	const { position } = useProps("ViewportOverlayWrapper", defaultStyleProps, rest);

	return <section style={{...positionStyles[position], position: "absolute"}}>
		{ children }
	</section>;
}
