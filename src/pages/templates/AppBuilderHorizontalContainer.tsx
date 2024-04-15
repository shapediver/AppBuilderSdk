import React, { } from "react";
import { Group, MantineSpacing, MantineThemeComponent, StyleProp } from "@mantine/core";
import { usePropsAppBuilder } from "hooks/ui/usePropsAppBuilder";

interface Props {
	children?: React.ReactNode;
}

interface StyleProps {
	w: StyleProp<React.CSSProperties["width"]>
	h: StyleProp<React.CSSProperties["width"]>
	justify: React.CSSProperties["justifyContent"]
	wrap: React.CSSProperties["flexWrap"]
	p: StyleProp<MantineSpacing>
}

const defaultStyleProps: StyleProps = {
	w: "100%",
	h: "100%",
	justify: "center",
	wrap: "nowrap",
	p: "xs",
};

type AppBuilderHorizontalContainerThemePropsType = Partial<StyleProps>;

export function AppBuilderHorizontalContainerThemeProps(props: AppBuilderHorizontalContainerThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

/**
 * Vertical container for AppBuilder
 * @param props 
 * @returns 
 */
export default function AppBuilderHorizontalContainer(props: Props & Partial<StyleProps>) {
	const { 
		children,
		...rest
	} = usePropsAppBuilder("AppBuilderHorizontalContainer", defaultStyleProps, props);

	return (
		<Group {...rest}>
			{children}
		</Group>
	);
}
