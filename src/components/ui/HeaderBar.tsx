import { Image, ActionIcon, ColorScheme, Header } from '@mantine/core';
import { IconSun, IconMoonStars } from '@tabler/icons-react';
import { useUiStore } from '../../app/shapediver/uiStore';

function HeaderBar() {
    const colorScheme = useUiStore(state => state.colorScheme);

    const toggleColorScheme = (value?: ColorScheme) => {
        useUiStore.setState({ colorScheme: (value || (colorScheme === 'dark' ? 'light' : 'dark')) })
    }
    
    return (
        <Header height={60} p="xs">
            <div style={{
                display: "flex",
                justifyContent: "space-between"
            }}>
                <Image
                    style={{
                        filter: colorScheme === 'dark' ? "" : "invert(1)"
                    }}
                    width={300}
                    fit="contain"
                    radius="md"
                    src="https://shapediver.com/app/imgs/sd-logo-white-600x84.webp"
                    alt="ShapeDiver Logo"
                />
                <ActionIcon
                    variant="outline"
                    color={colorScheme === 'dark' ? 'yellow' : 'blue'}
                    onClick={() => toggleColorScheme()}
                    title="Toggle color scheme"
                >
                    {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoonStars size={18} />}
                </ActionIcon>

            </div>
        </Header>

    );
}

export default HeaderBar;