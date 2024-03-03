import React from "react";
import { Paper } from "@mantine/core";
import { IAppBuilderWidgetPropsText } from "types/shapediver/appbuilder";
import MarkdownWidgetComponent from "../ui/MarkdownWidgetComponent";


export default function AppBuilderTextWidgetComponent({ text, markdown }: IAppBuilderWidgetPropsText) {
	
	if (text) {
		return <Paper>
			{ text }
		</Paper>;
	}
	else if (markdown) {
		return <Paper>
			<MarkdownWidgetComponent>
				{ markdown }
			</MarkdownWidgetComponent>
		</Paper>;
	}

	return <></>;
}
