import React from "react";
import { Group, Title } from "@mantine/core";
import ToggleMode from "./ToggleMode";

export default function Header() {
	return ( 
		<Group justify="space-between" gap="xs" px="md">
			<img src="/logo192.png" alt="ShapeDiver" width={32} height={32} />
			<Title order={4}>Theme Editor</Title>
			<ToggleMode />
		</Group>  
	);
} 