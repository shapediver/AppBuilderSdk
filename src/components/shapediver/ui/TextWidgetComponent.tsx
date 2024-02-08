import React from "react";
import Markdown from "react-markdown";
import { Paper } from "@mantine/core";

interface Props {
	children: string,
}

/**
 * Markdown widget component.
 *
 * @returns
 */


export default function TextWidgetComponent({ children = "" }: Props) {
	return <Paper withBorder radius="md" shadow="m" mb="xs" py="xs" px="xs">
		<Markdown>{ children }</Markdown>
	</Paper>;
}