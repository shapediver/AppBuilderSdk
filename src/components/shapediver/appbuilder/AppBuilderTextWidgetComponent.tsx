import React, { useContext } from "react";
import { MantineStyleProp, Paper } from "@mantine/core";
import { IAppBuilderWidgetPropsText } from "types/shapediver/appbuilder";
import MarkdownWidgetComponent from "../ui/MarkdownWidgetComponent";
import { AppBuilderContainerContext } from "context/AppBuilderContext";


export default function AppBuilderTextWidgetComponent({ text, markdown }: IAppBuilderWidgetPropsText) {
	
	const context = useContext(AppBuilderContainerContext);

	const styleProps: MantineStyleProp = {};
	if (context.orientation === "horizontal") {
		styleProps.height = "100%";
	}
	
	if (text) {
		return <Paper style={styleProps}>
			{ text }
		</Paper>;
	}
	else if (markdown) {
		return <Paper style={styleProps}>
			<MarkdownWidgetComponent>
				{ markdown }
			</MarkdownWidgetComponent>
		</Paper>;
	}

	return <></>;
}
