import { MantineThemeComponent, useProps } from "@mantine/core";
import React from "react";

const ViewportOverlayPosition = {
	TOP_LEFT: "top-left",
	TOP_RIGHT: "top-right",
	BOTTOM_LEFT: "bottom-left",
	BOTTOM_RIGHT: "bottom-right",
} as const;

export type ViewportOverlayPositionType = typeof ViewportOverlayPosition[keyof typeof ViewportOverlayPosition];

interface Props {
	children?: React.ReactNode;
}

interface StyleProps {
	position: ViewportOverlayPositionType;
}

const defaultStyleProps: StyleProps = {
	position: ViewportOverlayPosition.TOP_RIGHT,
};

const positionStyles = {
	[ViewportOverlayPosition.TOP_LEFT]: {
		top: "0",
		left: "0",
	},
	[ViewportOverlayPosition.TOP_RIGHT]: {
		top: "0",
		right: "0",
	},
	[ViewportOverlayPosition.BOTTOM_LEFT]: {
		bottom: "0",
		left: "0",
	},
	[ViewportOverlayPosition.BOTTOM_RIGHT]: {
		bottom: "0",
		right: "0",
	},
};

type ViewportOverlayWrapperThemePropsType = Partial<StyleProps>;

export function ViewportOverlayWrapperThemeProps(props: ViewportOverlayWrapperThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

export default function ViewportOverlayWrapper(props: Props & Partial<StyleProps>) {

	const { children = <></>, ...rest } = props;
	const { position } = useProps("ViewportOverlayWrapper", defaultStyleProps, rest);

	return <section style={{...positionStyles[position], position: "absolute"}}>
		{ children }
	</section>;
}
