import React  from "react";
import { Switch,  useMantineColorScheme } from "@mantine/core";

export default function ToggleMode() {
	const { colorScheme, toggleColorScheme } = useMantineColorScheme();
 
	return <Switch
		label="Dark mode"
		checked={colorScheme === "dark"}
		onChange={( ) => toggleColorScheme()}
	/>;
}
