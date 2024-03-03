import React from "react";
import Markdown from "react-markdown";
import { Anchor, Blockquote, Code, Text, Title, Divider, Image, MantineStyleProps, List } from "@mantine/core";
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
	const styleProps: MantineStyleProps = {
		mb: "xs"
	};

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
				return <Title order={1} {...rest} {...styleProps} />;
			},
			h2(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Title order={2} {...rest} {...styleProps} />;
			},
			h3(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Title order={3} {...rest} {...styleProps} />;
			},
			h4(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Title order={4} {...rest} {...styleProps} />;
			},
			h5(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Title order={5} {...rest} {...styleProps} />;
			},
			h6(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Title order={6} {...rest} {...styleProps} />;
			},
			hr(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Divider {...rest} {...styleProps} />;
			},
			p(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Text {...rest} {...styleProps} />;
			},
			a(props) {
				const {...rest} = props;
	
				// @ts-expect-error ignore
				return <Anchor underline="hover" {...rest} />;
			},
			ul(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <List {...rest} {...styleProps} />;
			},
			li(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <List.Item {...rest} />;
			},
		},
	};

	return <Markdown {...config } >{ children }</Markdown>;
}
