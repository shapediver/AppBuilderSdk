import React, { ReactElement, useState } from "react";
import { Button, MantineThemeComponent, useProps } from "@mantine/core";
import AppBuilderAppShellTemplatePage from "./AppBuilderAppShellTemplatePage";
import AppBuilderGridTemplatePage from "./AppBuilderGridTemplatePage";
import classes from "./AppBuilderTemplateSelector.module.css";

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
	/** Should buttons for showing/hiding the containers be shown? */
	showContainerButtons: boolean;
}

const defaultStyleProps: StyleProps = {
	template: "appshell",
	showContainerButtons: false,
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
		showContainerButtons,
		...nodes
	} = useProps("AppBuilderTemplateSelector", defaultStyleProps, props);

	const { top, left, right, bottom, ...otherNodes } = nodes;

	const [isTopDisplayed, setIsTopDisplayed] = useState(!!top);
	const [isLeftDisplayed, setIsLeftDisplayed] = useState(!!left);
	const [isRightDisplayed, setIsRightDisplayed] = useState(!!right);
	const [isBottomDisplayed, setIsBottomDisplayed] = useState(!!bottom);

	const mainNodes = {
		top: isTopDisplayed ? top : undefined,
		left: isLeftDisplayed ? left : undefined,
		right: isRightDisplayed ? right : undefined,
		bottom: isBottomDisplayed ? bottom : undefined,
	};

	const Template = templateMap[template];

	return (<>
		{showContainerButtons ? <Button.Group className={classes.buttonsTop}>
			<Button variant="filled" onClick={() => setIsTopDisplayed(!isTopDisplayed)}>Top</Button>
			<Button variant="filled" onClick={() => setIsLeftDisplayed(!isLeftDisplayed)} color="indigo">Left</Button>
			<Button variant="filled" onClick={() => setIsRightDisplayed(!isRightDisplayed)} color="violet">Right</Button>
			<Button variant="filled" onClick={() => setIsBottomDisplayed(!isBottomDisplayed)} color="cyan">Bottom</Button>
		</Button.Group> : <></>}
		<Template {...mainNodes} {...otherNodes} />
	</>
	);
}
