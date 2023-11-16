import classes from "components/ui/ModelCard.module.css";
import { Button, Card, Group, Image, Text } from "@mantine/core";
import { Link } from "react-router-dom";
import React from "react";

interface Props {
	title: string
	description: string,
	btnText: string,
	btnLink: string
	imageSrc: string
	imageAlt: string
}

export default function ModelCard({ title, description, btnText, btnLink,  imageSrc, imageAlt }: Props) {
	return (
		<>
			<Card shadow="sm" p="lg" radius="md" withBorder>
				<Card.Section>
					<Image
						src={imageSrc}
						height={160}
						style={{ padding: "1rem" }}
						fit="contain"
						alt={imageAlt}
					/>
				</Card.Section>
				<section className={classes.modelCardBody}>
					<section>
						<Group gap="md" mt="md" mb="xs">
							<Text fw={500}>{ title }</Text>
						</Group>

						<Text size="sm" c="dimmed">
							{ description }
						</Text>
					</section>

					<Button variant="light" color="blue" fullWidth mt="md" radius="md" component={Link} to={btnLink}>
						{ btnText }
					</Button>
				</section>
			</Card>
		</>
	);
}
