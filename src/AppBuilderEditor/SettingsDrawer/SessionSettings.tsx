import React from "react";
import { Accordion, Alert } from "@mantine/core";

export default function SessionSettings() {
	return (
		<Accordion.Item value="session-settings">
			<Accordion.Control>Session Settings</Accordion.Control>
			<Accordion.Panel>
				<Alert title="Sessions are not yet implemented" color="red" />
			</Accordion.Panel>
		</Accordion.Item>
	);
} 