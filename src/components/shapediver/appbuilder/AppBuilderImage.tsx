import React from "react";
import { Image, ImageProps, Paper, useProps } from "@mantine/core";
import { AppBuilderContainerTypeEnum } from "types/shapediver/appbuilder";

interface Props {
	/** Type of container */
	containerType?: AppBuilderContainerTypeEnum
}

type SomeImageProps = Pick<ImageProps, "src" | "radius" | "fit">;

const defaultStyleProps : Partial<SomeImageProps> = {
	radius: "md",
	fit: "contain",
};

export default function AppBuilderImage(props: SomeImageProps & Props ) {
	const { containerType, ...rest } = props;
	const { radius, fit } = useProps("AppBuilderImage", defaultStyleProps, rest);

	return <Paper
		h={containerType === AppBuilderContainerTypeEnum.Row ? "100%" : undefined}
		w={containerType === AppBuilderContainerTypeEnum.Column ? "100%" : undefined}
		radius={radius}
		p={0}
	>
		<Image 
			{...rest} 
			fit={fit}
			radius={radius}
			h={containerType === AppBuilderContainerTypeEnum.Row ? "100%" : undefined}
			w={containerType === AppBuilderContainerTypeEnum.Column ? "100%" : undefined}
		/>
	</Paper>;
}
