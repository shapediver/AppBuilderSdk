import React from "react";
import Markdown from "react-markdown";
import { Blockquote, Code, Paper, Text, Title, Divider, Image } from "@mantine/core";
import { Options } from "react-markdown/lib";

interface Props {
	children: string,
}

/**
 * Markdown widget component.
 *
 * @returns
 */


export default function TextWidgetComponent({ children = "" }: Props) {
	const config: Options = {
		components: {
			b(props) {
				const {node, ...rest} = props;
				// @ts-ignore
				return <Text fw={700} {...rest} />;
			},
			blockquote(props) {
				const {node, ...rest} = props;
				// @ts-ignore
				return <Blockquote {...rest} />;
			},
			code(props) {
				const {node, ...rest} = props;
				// @ts-ignore
				return <Code {...rest} />;
			},
			img(props) {
				const {node, ...rest} = props;
				// @ts-ignore
				return <Image {...rest} />;
			},
			h1(props) {
				const {node, ...rest} = props;
				// @ts-ignore
				return <Title order={1} {...rest} />;
			},
			h2(props) {
				const {node, ...rest} = props;
				// @ts-ignore
				return <Title order={2} {...rest} />;
			},
			h3(props) {
				const {node, ...rest} = props;
				// @ts-ignore
				return <Title order={3} {...rest} />;
			},
			h4(props) {
				const {node, ...rest} = props;
				// @ts-ignore
				return <Title order={4} {...rest} />;
			},
			h5(props) {
				const {node, ...rest} = props;
				// @ts-ignore
				return <Title order={5} {...rest} />;
			},
			h6(props) {
				const {node, ...rest} = props;
				// @ts-ignore
				return <Title order={6} {...rest} />;
			},
			hr(props) {
				const {node, ...rest} = props;
				// @ts-ignore
				return <Divider {...rest} />;
			},
			p(props) {
				const {node, ...rest} = props;
				// @ts-ignore
				return <Text {...rest} />;
			},
		},
	};

	return <Paper withBorder radius="md" shadow="m" mb="xs" py="xs" px="xs">
		<Markdown {...config } >{ children }</Markdown>
	</Paper>;
}
