import { Navbar } from '@mantine/core';
import { NavLink, Outlet } from "react-router-dom";

function NavigationBar() {
    return (

        <Navbar width={{ sm: 200, lg: 300 }} p="xs">
            <Navbar.Section mx="-xs" px="xs">
                <NavLink to="/">Home</NavLink>
            </Navbar.Section>

            <Navbar.Section mx="-xs" px="xs">
                <NavLink to="/view">View</NavLink>
            </Navbar.Section>

            <Navbar.Section mx="-xs" px="xs">
                <NavLink to="/modelSelect">Model Select</NavLink>
            </Navbar.Section>
            <Outlet />
        </Navbar>

    );
}

export default NavigationBar;