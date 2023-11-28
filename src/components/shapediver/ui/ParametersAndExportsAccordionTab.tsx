import React from "react";
import classes from "./ParametersAndExportsAccordionTab.module.css";
import { Tabs, TabsPanelProps } from "@mantine/core";

/**
 * Functional component that creates a tab for accordion of parameter and export components.
 *
 * @returns
 */

export default function ParametersAndExportsAccordionTab(props: TabsPanelProps) {
	return <Tabs.Panel { ...props } className={`${classes.tabsPanel} ${props.className || ""}`} />;
}
