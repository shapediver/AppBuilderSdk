import React from "react";
import Markdown from "react-markdown";
import { Anchor, Blockquote, Code, Text, Title, Divider, Image, MantineStyleProps, List } from "@mantine/core";
import { Options } from "react-markdown/lib";

interface Props {
	children: string,
}

/**
 * Parse and apply ShapeDiver-specific markup for colored text. 
 * 
 * @param node 
 * @param index 
 * @returns 
 */
const mapNode = (node: React.ReactNode, index: number = 0) : React.ReactNode => {
	if (Array.isArray(node)) {
		console.debug(node);
		
		return node.map((child, index) => mapNode(child, index));
	}
	
	if (typeof node === "string") {

		/** 
		 * TODO improve this to parse text marked up like shown in the following example. 
		 * Note that a single node might need to be mapped to multiple span elements.  
		 * 
		 * This shows {two red}(color=red) words and {three more blue}(color=blue) words. 
		 */
		if (node.startsWith("color=")) {
			const parts = node.split(" ");
			const color = parts[0].split("=")[1];
			const value = parts.slice(1).join(" ");
			
			return <>
				<span key={index} style={{color: color}}>{value}</span>
			</>;
		}
	
		return node;
	}

	return node;
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
		components: {
			b(props) {
				const {children, ...rest} = props;

				// @ts-expect-error ignore
				return <Text fw={700} {...rest} {...styleProps}>{mapNode(children)}</Text>;
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
			em(props) {
				const {children, ...rest} = props;

				return <em {...rest}>{mapNode(children)}</em>;
			},
			img(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Image {...rest} />;
			},
			h1(props) {
				const {children, ...rest} = props;

				// @ts-expect-error ignore
				return <Title order={1} {...rest} {...styleProps}>{mapNode(children)}</Title>;
			},
			h2(props) {
				const {children, ...rest} = props;

				// @ts-expect-error ignore
				return <Title order={2} {...rest} {...styleProps}>{mapNode(children)}</Title>;
			},
			h3(props) {
				const {children, ...rest} = props;

				// @ts-expect-error ignore
				return <Title order={3} {...rest} {...styleProps}>{mapNode(children)}</Title>;
			},
			h4(props) {
				const {children, ...rest} = props;

				// @ts-expect-error ignore
				return <Title order={4} {...rest} {...styleProps}>{mapNode(children)}</Title>;
			},
			h5(props) {
				const {children, ...rest} = props;

				// @ts-expect-error ignore
				return <Title order={5} {...rest} {...styleProps}>{mapNode(children)}</Title>;
			},
			h6(props) {
				const {children, ...rest} = props;

				// @ts-expect-error ignore
				return <Title order={6} {...rest} {...styleProps}>{mapNode(children)}</Title>;
			},
			hr(props) {
				const {...rest} = props;

				// @ts-expect-error ignore
				return <Divider {...rest} {...styleProps} />;
			},
			p(props) {
				const {children, ...rest} = props;
				
				// @ts-expect-error ignore
				return <Text {...rest} {...styleProps}>{mapNode(children)}</Text>;
			},
			strong(props) {
				const {children, ...rest} = props;

				return <strong {...rest}>{mapNode(children)}</strong>;
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
				const {children, ...rest} = props;

				// @ts-expect-error ignore
				return <List.Item {...rest}>{mapNode(children)}</List.Item>;
			},
		},
	};

	return <Markdown {...config } >{ children }</Markdown>;
}
