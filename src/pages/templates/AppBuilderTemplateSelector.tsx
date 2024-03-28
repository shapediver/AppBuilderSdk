import React, { ReactElement } from "react";
import { MantineThemeComponent, useProps } from "@mantine/core";
import AppBuilderAppShellTemplatePage from "./AppBuilderAppShellTemplatePage";
import AppBuilderGridTemplatePage from "./AppBuilderGridTemplatePage";

export type AppBuilderTemplateType = "grid" | "appshell"

type TemplateMapType = Record<AppBuilderTemplateType, (props: Props) => ReactElement>;

const templateMap: TemplateMapType = {
	"appshell": AppBuilderAppShellTemplatePage,
	"grid": AppBuilderGridTemplatePage,
};

interface Props {
	top?: React.ReactNode;
	left?: React.ReactNode;
	right?: React.ReactNode;
	bottom?: React.ReactNode;
	children?: React.ReactNode;
}

interface StyleProps {
	/** template to use */
	template: AppBuilderTemplateType;
}

const defaultStyleProps: StyleProps = {
	template: "grid",
};

type AppBuilderTemplateSelectorThemePropsType = Partial<StyleProps>;

export function AppBuilderTemplateSelectorThemeProps(props: AppBuilderTemplateSelectorThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

export default function AppBuilderTemplateSelector(props: Props & Partial<StyleProps>) {

	// style properties
	const { 
		template,
		...rest
	} = useProps("AppBuilderTemplateSelector", defaultStyleProps, props);

	const Template = templateMap[template];

	return (
		<Template {...rest} />
	);
}
