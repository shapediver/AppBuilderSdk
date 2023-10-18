import React from "react";

export enum Positions {
	TOP_LEFT = "top-left",
	TOP_RIGHT = "top-right",
	BOTTOM_LEFT = "bottom-left",
	BOTTOM_RIGHT = "bottom-right",
}

interface Props {
	position: Positions;
	children?: React.ReactNode;
}

const positionStyles = {
	[Positions.TOP_LEFT]: {
		top: "0",
		left: "0",
	},
	[Positions.TOP_RIGHT]: {
		top: "0",
		right: "0",
	},
	[Positions.BOTTOM_LEFT]: {
		bottom: "0",
		left: "0",
	},
	[Positions.BOTTOM_RIGHT]: {
		bottom: "0",
		right: "0",
	},
};

export default function ViewportAdditionalUIWrapper({ position, children = <></> }: Props) {
	return <section style={{...positionStyles[position], position: "absolute"}}>
		{ children }
	</section>;
}
