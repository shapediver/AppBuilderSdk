import { Image, Container, Card, Group, Text, Button, Blockquote } from "@mantine/core";
import { Link } from "react-router-dom";
import React from "react";
import { IconInfoCircle } from "@tabler/icons-react";
import classes from "pages/HomePage.module.css";

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
			<Container className={classes.container} size="lg" px="lg">
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
						<Blockquote color="blue" icon={<IconInfoCircle />} mt="xl">
Check out the source code for this example <a href="https://github.com/shapediver/ShapeDiverReactExample">here</a>.
						</Blockquote>
					</Group>
				</Card>

				<div className={classes.pageContainer}>
					<Card className={classes.pageCard} shadow="sm" p="lg" radius="md" withBorder>
						<Card.Section>
							<Image
								src="https://img2.storyblok.com/1280x0/filters:format(webp)/f/92524/2048x1481/81a30bd9de/0202.png"
								height={160}
								style={{ padding: "1rem" }}
								fit="contain"
								alt="Under Construction"
							/>
						</Card.Section>
						<Group gap="md" mt="md" mb="xs">
							<Text fw={500}>Model View Page</Text>
						</Group>

						<Text size="sm" c="dimmed">
This example opens a session with a ShapeDiver model, displays it in a viewport, and creates two tabs of components representing
the parameters and exports defined by the model. All components are easily customizable.
						</Text>

						<Button variant="light" color="blue" fullWidth mt="md" radius="md" component={Link} to="/view">
              On to the View Page!
						</Button>
					</Card>

					<Card className={classes.pageCard} shadow="sm" p="lg" radius="md" withBorder>
						<Card.Section>
							<Image
								src="https://img2.storyblok.com/1280x0/filters:format(webp)/f/92524/2048x1481/81a30bd9de/0202.png"
								height={160}
								style={{ padding: "1rem" }}
								fit="contain"
								alt="Under Construction"
							/>
						</Card.Section>
						<Group gap="md" mt="md" mb="xs">
							<Text fw={500}>Model Select Page</Text>
						</Group>

						<Text size="sm" c="dimmed">
This example displays a single viewport into which sessions with multiple ShapeDiver models can be loaded at once.
The settings of the model which is selected first are used to configure the viewport (camera, controls, etc). 
Parameter and export controls are shown for all selected models. 
						</Text>

						<Button variant="light" color="blue" fullWidth mt="md" radius="md" component={Link} to="/modelSelect">
              On to the Model Select Page!
						</Button>
					</Card>
				</div>

				<div className={classes.pageContainer}>
					<Card className={classes.pageCard} shadow="sm" p="lg" radius="md" withBorder>
						<Card.Section>
							<Image
								src="https://img2.storyblok.com/1280x0/filters:format(webp)/f/92524/2048x1481/81a30bd9de/0202.png"
								height={160}
								style={{ padding: "1rem" }}
								fit="contain"
								alt="Under Construction"
							/>
						</Card.Section>
						<Group gap="md" mt="md" mb="xs">
							<Text fw={500}>Multiple Viewports and Models Page</Text>
						</Group>

						<Text size="sm" c="dimmed">
							This example displays multiple viewports and models.
						</Text>

						<Button variant="light" color="blue" fullWidth mt="md" radius="md" component={Link} to="/multipleViewport">
							On to the Multiple Viewports and Models page!
						</Button>
					</Card>

					<Card className={classes.pageCard} shadow="sm" p="lg" radius="md" withBorder>
						<Card.Section>
							<Image
								src="https://img2.storyblok.com/1280x0/filters:format(webp)/f/92524/2048x1481/81a30bd9de/0202.png"
								height={160}
								style={{ padding: "1rem" }}
								fit="contain"
								alt="Under Construction"
							/>
						</Card.Section>
						<Group gap="md" mt="md" mb="xs">
							<Text fw={500}>Custom UI Page</Text>
						</Group>

						<Text size="sm" c="dimmed">
This example shows how to use Grasshopper to influence the parameter panel (show/hide parameters, add custom parameters).
						</Text>

						<Button variant="light" color="blue" fullWidth mt="md" radius="md" component={Link} to="/customui">
              On to the Custom UI page!
						</Button>
					</Card>
				</div>
			</Container>
		</>
	);
}
