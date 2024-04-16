import React, { useContext } from "react";
import { MantineStyleProp, MantineThemeComponent, Paper, PaperProps } from "@mantine/core";
import { IAppBuilderWidgetPropsText } from "types/shapediver/appbuilder";
import MarkdownWidgetComponent from "../ui/MarkdownWidgetComponent";
import { AppBuilderContainerContext } from "context/AppBuilderContext";
import { usePropsAppBuilder } from "hooks/ui/usePropsAppBuilder";

type StylePros = PaperProps;

const defaultStyleProps : Partial<StylePros> = {
};

type AppBuilderTextWidgetThemePropsType = Partial<StylePros>;

export function AppBuilderTextWidgetThemeProps(props: AppBuilderTextWidgetThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

export default function AppBuilderTextWidgetComponent(props: IAppBuilderWidgetPropsText & AppBuilderTextWidgetThemePropsType) {
	
	const { text, markdown, ...rest } = props;

	const themeProps = usePropsAppBuilder("AppBuilderTextWidgetComponent", defaultStyleProps, rest);
	
	const context = useContext(AppBuilderContainerContext);

	const styleProps: MantineStyleProp = {};
	if (context.orientation === "horizontal") {
		styleProps.height = "100%";
	}
	
	if (text) {
		return <Paper {...themeProps} style={styleProps}>
			{ text }
		</Paper>;
	}
	else if (markdown) {
		return <Paper {...themeProps} style={styleProps}>
			<MarkdownWidgetComponent>
				{ markdown }
			</MarkdownWidgetComponent>
		</Paper>;
	}

	return <></>;
}
