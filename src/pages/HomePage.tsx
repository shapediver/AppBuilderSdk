import { Image, Container, Card, Group, Text, Blockquote, Center } from "@mantine/core";
import React from "react";
import { IconInfoCircle } from "@tabler/icons-react";
import classes from "~/pages/HomePage.module.css";
import ModelCard from "@AppBuilderShared/components/ui/ModelCard";

const modelCards = [
	{
		title: "Model View Page",
		description: "This example opens a session with a ShapeDiver model, displays it in a viewport, and creates two tabs of components representing the parameters and exports defined by the model. All components are easily customizable.",
		btnText: "Open example",
		btnLink: "/view",
		imageSrc: "https://img2.storyblok.com/1280x0/filters:format(webp)/f/92524/2048x1481/81a30bd9de/0202.png",
		imageAlt: "Under Construction"
	},
	{
		title: "Model Select Page",
		description: "This example displays a single viewport into which sessions with multiple ShapeDiver models can be loaded at once. The settings of the model which is selected first are used to configure the viewport (camera, controls, etc). Parameter and export controls are shown for all selected models.",
		btnText: "Open example",
		btnLink: "/modelSelect",
		imageSrc: "https://img2.storyblok.com/1280x0/filters:format(webp)/f/92524/2048x1481/81a30bd9de/0202.png",
		imageAlt: "Under Construction"
	},
	{
		title: "Multiple Viewports and Models Page",
		description: "This example displays multiple viewports and models.",
		btnText: "Open example",
		btnLink: "/multipleViewport",
		imageSrc: "https://img2.storyblok.com/1280x0/filters:format(webp)/f/92524/2048x1481/81a30bd9de/0202.png",
		imageAlt: "Under Construction"
	},
	{
		title: "Custom UI Page",
		description: "This example shows how to use Grasshopper to influence the parameter panel (show/hide parameters, add custom parameters). This motivated the development of the web app, which allows for more flexibility.",
		btnText: "Open example",
		btnLink: "/customui",
		imageSrc: "https://img2.storyblok.com/1280x0/filters:format(webp)/f/92524/2048x1481/81a30bd9de/0202.png",
		imageAlt: "Under Construction"
	},
	{
		title: "Web App Test",
		description: "Static example page showing the capabilities of the app builder page.",
		btnText: "Open example",
		btnLink: "/appBuilderTest",
		imageSrc: "https://img2.storyblok.com/1280x0/filters:format(webp)/f/92524/2048x1481/81a30bd9de/0202.png",
		imageAlt: "Under Construction"
	},
	{
		title: "Web App",
		description: "An example app controlled by a Grasshopper model. The parameter, text, and image widgets can be parametrically controlled.",
		btnText: "Open example",
		btnLink: "/appBuilder",
		imageSrc: "https://img2.storyblok.com/1280x0/filters:format(webp)/f/92524/2048x1481/81a30bd9de/0202.png",
		imageAlt: "Under Construction"
	}
];
/**
 * Function that creates the home page.
 * On this page, an introduction is provided and all other pages are linked.
 *
 * Currently under construction.
 *
 * @returns
 */
export default function HomePage() {
	return (
		<>
			<Container size="lg" px="lg">
				<h1>ShapeDiver React Example</h1>

				<Card shadow="sm" p="lg" radius="md">
					<Card.Section>
						<Image
							src="https://viewer.shapediver.com/v3/images/under_construction.png"
							height={160}
							alt="Under Construction"
						/>
					</Card.Section>
					<Group gap="md" mt="md" mb="xs">
						<Text size="sm" c="dimmed">
On this example page we present several use cases that utilize custom React components and hooks for the creation of viewports, sessions,
controls for parameters and exports, and much more. All these components and hooks are provided in the repository and can be customized easily.
						</Text>
						<Center w="100%">
							<Blockquote color="blue" icon={<IconInfoCircle />} mt="xl">
	Check out the source code for this example <a href="https://github.com/shapediver/ShapeDiverReactExample">here</a>.
							</Blockquote>
						</Center>
					</Group>
				</Card>

				<div className={classes.pageContainer}>
					{modelCards.map((card, index) => (
						<ModelCard
							key={index}
							title={card.title}
							description={card.description}
							btnText={card.btnText}
							btnLink={card.btnLink}
							imageSrc={card.imageSrc}
							imageAlt={card.imageAlt}
						/>
					))}
				</div>
			</Container>
		</>
	);
}
