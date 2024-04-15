import React, { useContext } from "react";
import { Image, ImageProps, MantineThemeComponent, Paper, useProps, Anchor } from "@mantine/core";
import { IAppBuilderWidgetPropsAnchor } from "types/shapediver/appbuilder";
import { AppBuilderContainerContext } from "context/AppBuilderContext";

interface Props extends IAppBuilderWidgetPropsAnchor{
}

type SomeImageProps = Pick<ImageProps, "src" | "radius" | "fit">;

const defaultStyleProps : Partial<SomeImageProps> = {
	radius: "md",
	fit: "contain",
};

type AppBuilderImageThemePropsType = Partial<SomeImageProps>;

export function AppBuilderImageThemeProps(props: AppBuilderImageThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

export default function AppBuilderImage(props: SomeImageProps & Props ) {
	
	const { anchor, target, ...rest } = props;
	const { radius, fit } = useProps("AppBuilderImage", defaultStyleProps, rest);

	const context = useContext(AppBuilderContainerContext);
	const orientation = context.orientation;
	
	const componentImage = <Image
		{...rest}
		fit={fit}
		radius={radius}
		h={orientation === "horizontal" ? "100%" : undefined}
		w={orientation === "vertical" ? "100%" : undefined}
	/>;

	return <Paper
		h={orientation === "horizontal" ? "100%" : undefined}
		w={orientation === "vertical" ? "100%" : undefined}
		radius={radius}
		pt={0}
		pr={0}
		pb={0}
		pl={0}
	>
		{ anchor ? <Anchor href={anchor} target={target}>{componentImage}</Anchor> : componentImage }
	</Paper>;
}
