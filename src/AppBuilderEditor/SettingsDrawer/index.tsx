import React, { useState } from "react";
import { Drawer, ActionIcon, Accordion, Divider } from "@mantine/core";
import { IconSettings } from "@tabler/icons-react";
import ThemeSettings from "./ThemeSettings";
import SessionSettings from "./SessionSettings";
import DownloadFile from "./DownloadFile";
import JSONPreview from "./JSONPreview";
import Header from "./Header"; 

export default function SettingsDrawer() {
	const [opened, setOpened] = useState(false);

	return (
		<div>
			<ActionIcon
				variant="filled"
				size="xl"
				radius="xl"
				color="blue"
				style={{
					position: "fixed",
					bottom: "2rem",
					right: "2rem",
					zIndex: 1
				}}
				onClick={() => setOpened(true)}
			>
				<IconSettings size={24} />
			</ActionIcon>

			<Drawer
				opened={opened}
				title={<Header />}
				onClose={() => setOpened(false)}
				position="right"
				size="md"
				padding="0"
			> 
				<Divider />
				<Accordion defaultValue="theme-settings">
					<SessionSettings />
					<ThemeSettings />
					<JSONPreview />
				</Accordion>

				<DownloadFile />
			</Drawer>
		</div>
	);
}
