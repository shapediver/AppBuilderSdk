import { Image, ActionIcon, ColorScheme, MediaQuery } from '@mantine/core';
import { IconSun, IconMoonStars } from '@tabler/icons-react';
import { useGlobalUiStore } from '../../context/globalUiStore';

function HeaderBar() {
    const colorScheme = useGlobalUiStore(state => state.colorScheme);

    const toggleColorScheme = (value?: ColorScheme) => {
        useGlobalUiStore.setState({ colorScheme: (value || (colorScheme === 'dark' ? 'light' : 'dark')) })
    }

    return (
        <>
            <MediaQuery smallerThan="sm" styles={{ width: "165px!important" }}>
                <Image
                    style={{
                        width: "300px",
                        filter: colorScheme === 'dark' ? "" : "invert(1)",
                    }}
                    fit="contain"
                    radius="md"
                    src="https://shapediver.com/app/imgs/sd-logo-white-600x84.webp"
                    alt="ShapeDiver Logo"
                />
            </MediaQuery>

            <ActionIcon
                variant="outline"
                color={colorScheme === 'dark' ? 'yellow' : 'blue'}
                onClick={() => toggleColorScheme()}
                title="Toggle color scheme"
                style={{ float: "right" }}
            >
                {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoonStars size={18} />}
            </ActionIcon>
        </>
    );
}

export default HeaderBar;