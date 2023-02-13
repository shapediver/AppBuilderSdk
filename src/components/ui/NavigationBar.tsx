import { Navbar, Button } from '@mantine/core';
import { Link, Outlet } from "react-router-dom";

function NavigationBar() {

    return (
        <Navbar width={{ sm: 200, lg: 300 }} p="xs">
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
                    Model Select Page
                </Button>
            </Navbar.Section>

            <Outlet />
        </Navbar>
    );
}

export default NavigationBar;