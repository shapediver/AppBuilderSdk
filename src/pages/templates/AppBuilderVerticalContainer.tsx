import React, { } from "react";
import { MantineSpacing, MantineThemeComponent, Stack, StyleProp, useProps } from "@mantine/core";

interface Props {
	children?: React.ReactNode;
}

interface StyleProps {
	/** padding */
	p: StyleProp<MantineSpacing>;
}

const defaultStyleProps: StyleProps = {
	p: "xs",
};

type AppBuilderVerticalContainerThemePropsType = Partial<StyleProps>;

export function AppBuilderVerticalContainerThemeProps(props: AppBuilderVerticalContainerThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

/**
 * Vertical container for AppBuilder
 * @param props 
 * @returns 
 */
export default function AppBuilderVerticalContainer(props: Props & Partial<StyleProps>) {
	const { 
		children,
		...rest
	} = useProps("AppBuilderVerticalContainer", defaultStyleProps, props);

	return (
		<Stack {...rest}>{children}</Stack>
	);
}
