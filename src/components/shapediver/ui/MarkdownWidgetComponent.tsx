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


export default function MarkdownWidgetComponent({ children = "" }: Props) {
	const config: Options = {
		components: {
			b(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Text fw={700} {...rest} />;
			},
			blockquote(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Blockquote {...rest} />;
			},
			code(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Code {...rest} />;
			},
			img(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Image {...rest} />;
			},
			h1(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Title order={1} {...rest} />;
			},
			h2(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Title order={2} {...rest} />;
			},
			h3(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Title order={3} {...rest} />;
			},
			h4(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Title order={4} {...rest} />;
			},
			h5(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Title order={5} {...rest} />;
			},
			h6(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Title order={6} {...rest} />;
			},
			hr(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Divider {...rest} />;
			},
			p(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Text {...rest} />;
			},
		},
	};

	return <Paper>
		<Markdown {...config } >{ children }</Markdown>
	</Paper>;
}
