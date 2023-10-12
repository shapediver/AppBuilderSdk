import { Image, Container, Card, Group, Text, Button } from "@mantine/core";
import { Link } from "react-router-dom";
import React from "react";

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
			<Container style={{ paddingTop: "3rem" }} size="lg" px="lg">
				<h1>ShapeDiver React Example</h1>

				<Card shadow="sm" p="lg" radius="md">
					<Card.Section>
						<Image
							src="https://viewer.shapediver.com/v3/images/under_construction.png"
							height={160}
							alt="Under Construction"
						/>
					</Card.Section>
					<Group position="apart" mt="md" mb="xs">
						<Text size="sm" color="dimmed">
On this example page we present several use cases that utilize React components for the creation of viewports, sessions,
components representing parameters and exports, and much more. All these components are provided in the repository and can be customized easily.
						</Text>
					</Group>
				</Card>

				<div style={{ display: "flex", justifyContent: "space-between", paddingTop: "2rem" }}>

					<Card style={{ width: "50%" }} shadow="sm" p="lg" radius="md" withBorder>
						<Card.Section>
							<Image
								src="https://img2.storyblok.com/1280x0/filters:format(webp)/f/92524/2048x1481/81a30bd9de/0202.png"
								height={160}
								style={{ padding: "1rem" }}
								fit="contain"
								alt="Under Construction"
							/>
						</Card.Section>
						<Group position="apart" mt="md" mb="xs">
							<Text weight={500}>Model View Page</Text>
						</Group>

						<Text size="sm" color="dimmed">
This example opens a single session with a ShapeDiver model, displays it in a viewport, and creates two tabs of components representing
the parameters and exports defined by the model. All components are easily customizable.
						</Text>

						<Button variant="light" color="blue" fullWidth mt="md" radius="md" component={Link} to="/view">
              On to the View Page!
						</Button>
					</Card>

					<div style={{ width: "1rem" }}></div>

					<Card style={{ width: "50%" }} shadow="sm" p="lg" radius="md" withBorder>
						<Card.Section>
							<Image
								src="https://img2.storyblok.com/1280x0/filters:format(webp)/f/92524/2048x1481/81a30bd9de/0202.png"
								height={160}
								style={{ padding: "1rem" }}
								fit="contain"
								alt="Under Construction"
							/>
						</Card.Section>
						<Group position="apart" mt="md" mb="xs">
							<Text weight={500}>Model Select Page</Text>
						</Group>

						<Text size="sm" color="dimmed">
This example displays a single viewport in which sessions with multiple ShapeDiver models can be loaded at once.
The settings of the model which is selected first are used to configure the viewport (camera, controls, etc).
						</Text>

						<Button variant="light" color="blue" fullWidth mt="md" radius="md" component={Link} to="/modelSelect">
              On to the Model Select Page!
						</Button>
					</Card>
				</div>

				<div style={{ display: "flex", justifyContent: "space-between", paddingTop: "2rem" }}>
					<Card style={{ width: "50%" }} shadow="sm" p="lg" radius="md" withBorder>
						<Card.Section>
							<Image
								src="https://img2.storyblok.com/1280x0/filters:format(webp)/f/92524/2048x1481/81a30bd9de/0202.png"
								height={160}
								style={{ padding: "1rem" }}
								fit="contain"
								alt="Under Construction"
							/>
						</Card.Section>
						<Group position="apart" mt="md" mb="xs">
							<Text weight={500}>Multiple models on the same page</Text>
						</Group>

						<Text size="sm" color="dimmed">
							This example displays a multiple viewports with the same amount of multiple sessions.
						</Text>

						<Button variant="light" color="blue" fullWidth mt="md" radius="md" component={Link} to="/multipleViewport">
							On to the multiple Models Page!
						</Button>
					</Card>
				</div>
			</Container>
		</>
	);
}
