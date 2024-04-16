import React from "react";
import Markdown from "react-markdown";
import { Anchor, Blockquote, Code, Text, Title, Divider, Image, MantineStyleProps, List, Table } from "@mantine/core";
import { Options } from "react-markdown/lib";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import {visit} from "unist-util-visit";
import { v4 as uuid } from "uuid";

interface Props {
	children: string,
}

const spanDirective = function() {
	/**
	 * @param {import("mdast").Root} tree
	 *   Tree.
	 * @param {import("vfile").VFile} file
	 *   File.
	 * @returns {undefined}
	 *   Nothing.
	 */
	return (tree: any, file: any) => {
		visit(tree, function(node) {
			if (
				node.type === "containerDirective" ||
				node.type === "leafDirective" ||
				node.type === "textDirective"
			) {
				if (node.name !== "span") return;

				const data = node.data || (node.data = {});
				const attributes = node.attributes || {};
				const { color } = attributes;

				if (!color) {
					file.fail("Unexpected missing `color` on `span` directive", node);
				}

				data.hName = "span";
				data.hProperties = {
					style: {color},
					key: uuid(),
				};
			}
		});
	};
};

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
		remarkPlugins: [
			remarkDirective,
			remarkGfm,
			spanDirective,
		],
		components: {
			b(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Text fw={700} {...rest} />;
			},
			blockquote(props) {
				const {...rest} = props;

				return <Blockquote {...rest} />;
			},
			code(props) {
				const {...rest} = props;

				return <Code {...rest} />;
			},
			em(props) {
				const {...rest} = props;

				return <em {...rest} />;
			},
			img(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Image {...rest} />;
			},
			h1(props) {
				const {...rest} = props;

				return <Title order={1} {...rest} {...styleProps} />;
			},
			h2(props) {
				const {...rest} = props;

				return <Title order={2} {...rest} {...styleProps} />;
			},
			h3(props) {
				const {...rest} = props;

				return <Title order={3} {...rest} {...styleProps} />;
			},
			h4(props) {
				const {...rest} = props;

				return <Title order={4} {...rest} {...styleProps} />;
			},
			h5(props) {
				const {...rest} = props;

				return <Title order={5} {...rest} {...styleProps} />;
			},
			h6(props) {
				const {...rest} = props;

				return <Title order={6} {...rest} {...styleProps} />;
			},
			hr(props) {
				const {...rest} = props;

				return <Divider {...rest} {...styleProps} />;
			},
			p(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Text {...rest} {...styleProps} />;
			},
			strong(props) {
				const {...rest} = props;

				return <strong {...rest} />;
			},
			a(props) {
				const {...rest} = props;
			
				// @ts-expect-error ignore
				return <Anchor target="_blank" {...rest} />;
			},
			ul(props) {
				const {...rest} = props;

				return <List {...rest} {...styleProps} />;
			},
			li(props) {
				const {...rest} = props;

				return <List.Item {...rest} />;
			},
			table(props) {
				const {...rest} = props;

				return <Table {...rest} {...styleProps} />;
			},
			thead(props) {
				const {...rest} = props;

				return <Table.Thead {...rest} {...styleProps} />;
			},
			tbody(props) {
				const {...rest} = props;

				return <Table.Tbody {...rest} {...styleProps} />;
			},
			td(props) {
				const {...rest} = props;

				return <Table.Td {...rest} {...styleProps} />;
			},
			th(props) {
				const {...rest} = props;

				return <Table.Th {...rest} {...styleProps} />;
			},
			tr(props) {
				const {...rest} = props;

				return <Table.Tr {...rest} {...styleProps} />;
			},
		},
	};

	return <Markdown {...config } >{ children }</Markdown>;
}
