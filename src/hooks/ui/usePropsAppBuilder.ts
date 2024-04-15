import { useProps } from "@mantine/core";
import { AppBuilderContainerContext } from "context/AppBuilderContext";
import { IAppBuilderContainerWrapperStyleProps } from "pages/templates/AppBuilderContainerWrapper";
import { useContext } from "react";


const defaultStyleProps: IAppBuilderContainerWrapperStyleProps = {
	containerThemeOverrides: {}
};

/**
 * Extension of Mantine's useProps hook that allows for custom overrides per AppBuilder container.
 * @param component 
 * @param defaultProps 
 * @param props 
 * @param defaultOverrideProps 
 * @returns 
 */
export function usePropsAppBuilder<T extends Record<string, any>, U extends Partial<T>>(
	component: string, 
	defaultProps: U, 
	props: T, 
	defaultOverrideProps: Partial<IAppBuilderContainerWrapperStyleProps> = {}
) {
    
	const customprops = useProps(component, defaultProps, props);

	const { 
		containerThemeOverrides,
	} = useProps("AppBuilderPage", defaultStyleProps, defaultOverrideProps);

	const context = useContext(AppBuilderContainerContext);
	const overrides = containerThemeOverrides[context.name]?.components?.[component]?.defaultProps ?? {};
 
	return {
		...customprops,
		...overrides
	};
}
