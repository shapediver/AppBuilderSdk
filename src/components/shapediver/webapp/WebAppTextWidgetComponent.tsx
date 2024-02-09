import React from "react";
import Markdown from "react-markdown";
import { Paper } from "@mantine/core";
import { IWebAppWidgetPropsText } from "types/shapediver/webapp";


export default function WebAppTextWidgetComponent({ text, markdown }: IWebAppWidgetPropsText) {
	
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
