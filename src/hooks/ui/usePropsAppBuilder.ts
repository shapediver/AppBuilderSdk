import { useProps } from "@mantine/core";
import { AppBuilderContainerContext, AppBuilderTemplateContext } from "context/AppBuilderContext";
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
): T {
    
	const customprops = useProps(component, defaultProps, props);

	const { 
		containerThemeOverrides,
	} = useProps("AppBuilderPage", defaultStyleProps, defaultOverrideProps);

	const { name: template } = useContext(AppBuilderTemplateContext);
	const context = useContext(AppBuilderContainerContext);
	const overrides = containerThemeOverrides[template]?.[context.name]?.components?.[component]?.defaultProps ?? {};
 
	return {
		...customprops,
		...overrides
	};
}
