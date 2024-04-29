import { Center, Loader, LoaderProps, MantineSize, MantineThemeComponent, useProps } from "@mantine/core";
import React from "react";


interface Props {
	/** error message */
	children?: React.ReactNode;
}

interface StyleProps {
	/** 
	 * Type of the loader 
	 * @see https://mantine.dev/core/loader/?t=props
	 */
	type: string;
	/** 
	 * Size of the loader 
	 * @see https://mantine.dev/core/loader/?t=props
	 */
	size: number | MantineSize;
}

const defaultStyleProps: StyleProps = {
	type: "oval",
	size: "md"
};

type LoaderPageThemePropsType = Partial<StyleProps>;

export function LoaderPageThemeProps(props: LoaderPageThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

/**
 * Full screen alert page
 *
 * @returns
 */
export default function LoaderPage(props: Props & LoaderProps) {

	const { children, ...rest } = props;
	const restDefault = useProps("LoaderPage", defaultStyleProps, rest);

	return (
		<Center w="100vw" h="100vh">
			<Loader {...restDefault}>
				{children}
			</Loader>
		</Center>
	);
}
