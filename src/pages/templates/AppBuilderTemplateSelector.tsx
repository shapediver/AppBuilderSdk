import React, { ReactElement, useState } from "react";
import { Button, MantineThemeComponent, useProps } from "@mantine/core";
import AppBuilderAppShellTemplatePage from "./AppBuilderAppShellTemplatePage";
import AppBuilderGridTemplatePage from "./AppBuilderGridTemplatePage";
import classes from "./AppBuilderTemplateSelector.module.css";
import { AppBuilderTemplateContext } from "context/AppBuilderContext";

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

const showContainer = (toggleState: boolean | undefined): boolean => toggleState === undefined || toggleState === true;

const buttonVariant = (toggleState: boolean | undefined) => toggleState === undefined ? "outline" : toggleState ? "filled" : "light";

export default function AppBuilderTemplateSelector(props: Props & Partial<StyleProps>) {

	// style properties
	const { 
		template,
		showContainerButtons,
		...nodes
	} = useProps("AppBuilderTemplateSelector", defaultStyleProps, props);

	const { top, left, right, bottom, ...otherNodes } = nodes;

	const [isTopDisplayed, setIsTopDisplayed] = useState<boolean|undefined>(undefined);
	const [isLeftDisplayed, setIsLeftDisplayed] = useState<boolean|undefined>(undefined);
	const [isRightDisplayed, setIsRightDisplayed] = useState<boolean|undefined>(undefined);
	const [isBottomDisplayed, setIsBottomDisplayed] = useState<boolean|undefined>(undefined);

	const mainNodes = {
		top: showContainer(isTopDisplayed) ? top : undefined,
		left: showContainer(isLeftDisplayed) ? left : undefined,
		right: showContainer(isRightDisplayed) ? right : undefined,
		bottom: showContainer(isBottomDisplayed) ? bottom : undefined,
	};

	const Template = templateMap[template];

	return (<>
		{showContainerButtons ? <Button.Group className={classes.buttonsTop}>
			<Button variant={buttonVariant(isTopDisplayed)} onClick={() => setIsTopDisplayed(!isTopDisplayed)}>Top</Button>
			<Button variant={buttonVariant(isLeftDisplayed)}  onClick={() => setIsLeftDisplayed(!isLeftDisplayed)} color="indigo">Left</Button>
			<Button variant={buttonVariant(isRightDisplayed)}  onClick={() => setIsRightDisplayed(!isRightDisplayed)} color="violet">Right</Button>
			<Button variant={buttonVariant(isBottomDisplayed)}  onClick={() => setIsBottomDisplayed(!isBottomDisplayed)} color="cyan">Bottom</Button>
		</Button.Group> : <></>}
		<AppBuilderTemplateContext.Provider value={{ name: template }}>
			<Template {...mainNodes} {...otherNodes} />
		</AppBuilderTemplateContext.Provider>
	</>
	);
}
