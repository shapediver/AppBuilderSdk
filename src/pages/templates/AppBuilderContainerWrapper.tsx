import React, { } from "react";
import { AppBuilderContainerContext, IAppBuilderContainerContext } from "context/AppBuilderContext";
import { MantineThemeComponent, MantineThemeOverride, MantineThemeProvider, useProps } from "@mantine/core";
import AppBuilderVerticalContainer from "./AppBuilderVerticalContainer";
import AppBuilderHorizontalContainer from "./AppBuilderHorizontalContainer";

interface Props {
	name: string,
	orientation: "vertical" | "horizontal",
	children?: React.ReactNode;
}

/** Type for defining them overrides per AppBuilder container */
type ThemeOverridePerContainerType = { [key: string]: MantineThemeOverride };

export interface IAppBuilderContainerWrapperStyleProps {
	/** Theme overrides per container */
	containerThemeOverrides: ThemeOverridePerContainerType;
}

const defaultStyleProps: IAppBuilderContainerWrapperStyleProps = {
	containerThemeOverrides: {}
};

type AppBuilderContainerWrapperThemePropsType = Partial<IAppBuilderContainerWrapperStyleProps>;

export function AppBuilderPageThemeProps(props: AppBuilderContainerWrapperThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

/**
 * Wrapper for horizontal and vertical containers
 * @param props 
 * @returns 
 */
export default function AppBuilderContainerWrapper(props: Props & AppBuilderContainerWrapperThemePropsType) {
	const { containerThemeOverrides: _themeOverrides, name, orientation, children } = props;

	// style properties
	const { 
		containerThemeOverrides,
	} = useProps("AppBuilderContainerWrapper", defaultStyleProps, { containerThemeOverrides: _themeOverrides});

	const context: IAppBuilderContainerContext = {
		orientation,
		name
	};

	const container = orientation === "vertical" ? 
		<AppBuilderVerticalContainer>{children}</AppBuilderVerticalContainer> : 
		<AppBuilderHorizontalContainer>{children}</AppBuilderHorizontalContainer>;
		
	const c = <AppBuilderContainerContext.Provider value={context}>
		{container}
	</AppBuilderContainerContext.Provider>;

	if (name in containerThemeOverrides) {
		const theme = containerThemeOverrides[name];
		
		return <MantineThemeProvider theme={theme}>
			{c}
		</MantineThemeProvider>;
	}
	else {
		
		return c;
	}
	
}
