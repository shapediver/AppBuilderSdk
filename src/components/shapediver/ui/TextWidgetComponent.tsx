import React from "react";
import Markdown from "react-markdown";

interface Props {
	children: string,
}

/**
 * Markdown widget component.
 *
 * @returns
 */


export default function TextWidgetComponent({ children = "" }: Props) {
	return <Markdown>{ children }</Markdown>;
}
