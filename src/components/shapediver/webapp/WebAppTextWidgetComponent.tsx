import React from "react";
import Markdown from "react-markdown";
import { Paper } from "@mantine/core";
import { IAppBuilderWidgetPropsText } from "types/shapediver/webapp";


export default function AppBuilderTextWidgetComponent({ text, markdown }: IAppBuilderWidgetPropsText) {
	
	if (text) {
		return <Paper withBorder radius="md" shadow="m" mb="xs" py="xs" px="xs">
			{ text }
		</Paper>;
	}
	else if (markdown) {
		return <Paper withBorder radius="md" shadow="m" mb="xs" py="xs" px="xs">
			<Markdown>{ markdown }</Markdown>
		</Paper>;
	}

	return <></>;
}
