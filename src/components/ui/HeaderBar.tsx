import { Image, ActionIcon, MediaQuery, useMantineColorScheme } from "@mantine/core";
import { IconSun, IconMoonStars } from "@tabler/icons-react";
import { useLinkClickHandler } from "react-router-dom";
import React from "react";

/**
 * Functional component that creates an image and a icon for the header bar.
 * The image redirect to the home page.
 * The icon changes the color theme.
 *
 * @returns
 */
export default function HeaderBar() {
	const { colorScheme, toggleColorScheme } = useMantineColorScheme();

	return (
		<>
			<MediaQuery smallerThan="sm" styles={{ width: "165px!important" }}>
				<Image
					style={{
						cursor: "pointer",
						width: "300px",
						filter: colorScheme === "dark" ? "" : "invert(1)",
					}}
					fit="contain"
					radius="md"
					src="https://shapediver.com/app/imgs/sd-logo-white-600x84.webp"
					alt="ShapeDiver Logo"
					onClick={useLinkClickHandler("/")}
				/>
			</MediaQuery>

			<ActionIcon
				variant="outline"
				color={colorScheme === "dark" ? "yellow" : "blue"}
				onClick={() => toggleColorScheme()}
				title="Toggle color scheme"
				style={{ float: "right" }}
			>
				{colorScheme === "dark" ? <IconSun size={18} /> : <IconMoonStars size={18} />}
			</ActionIcon>
		</>
	);
}
