import { Image, ActionIcon, useMantineColorScheme, Group } from "@mantine/core";
import { IconSun, IconMoonStars } from "@tabler/icons-react";
import { useLinkClickHandler } from "react-router-dom";
import React from "react";
import classes from "./HeaderBar.module.css";

/**
 * Functional component that creates an image and a icon for the header bar.
 * The image redirect to the home page.
 * The icon changes the color theme.
 *
 * @returns
 */
export default function HeaderBar() {
	const { colorScheme, toggleColorScheme } = useMantineColorScheme();

	const goToHome = useLinkClickHandler<HTMLImageElement>("/");

	return (
		<Group justify="space-between" w="100%">
			<Image
				hiddenFrom="sm"
				className={classes.image}
				style={{
					width: "165px",
					filter: colorScheme === "dark" ? "" : "invert(1)",
				}}
				fit="contain"
				radius="md"
				src="https://shapediver.com/app/imgs/sd-logo-white-600x84.webp"
				alt="ShapeDiver Logo"
				onClick={(e) => goToHome(e)}
			/>
			<Image
				visibleFrom="sm"
				className={classes.image}
				style={{
					width: "250px",
					filter: colorScheme === "dark" ? "" : "invert(1)",
				}}
				fit="contain"
				radius="md"
				src="https://shapediver.com/app/imgs/sd-logo-white-600x84.webp"
				alt="ShapeDiver Logo"
				onClick={(e) => goToHome(e)}
			/>
			<ActionIcon
				variant="outline"
				color={colorScheme === "dark" ? "yellow" : "blue"}
				onClick={() => toggleColorScheme()}
				title="Toggle color scheme"
			>
				{colorScheme === "dark" ? <IconSun size={18} /> : <IconMoonStars size={18} />}
			</ActionIcon>
		</Group>
	);
}
