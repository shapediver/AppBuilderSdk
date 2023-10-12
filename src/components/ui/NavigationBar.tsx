import React from "react";
import { Navbar, Button } from "@mantine/core";
import { Link, Outlet } from "react-router-dom";

/**
 * Function that creates the contents of the navigation bar.
 * Creates buttons that points to various pages.
 *
 * @returns
 */
export default function NavigationBar() {
	return (
		<>
			<Navbar.Section mx="-xs" px="xs" >
				<Button variant="default" fullWidth mt="xs" radius="md" component={Link} to="/">
                    Home
				</Button>
			</Navbar.Section>

			<Navbar.Section mx="-xs" px="xs" >
				<Button variant="default" fullWidth mt="xs" radius="md" component={Link} to="/view">
                    View Page
				</Button>
			</Navbar.Section>

			<Navbar.Section mx="-xs" px="xs" >
				<Button variant="default" fullWidth mt="xs" radius="md" component={Link} to="/modelSelect">
                    Select Page
				</Button>
			</Navbar.Section>

			<Outlet />
		</>
	);
}
