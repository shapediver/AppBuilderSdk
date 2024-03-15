import { IAppBuilderSettingsSession } from "types/shapediver/appbuilder";
import { ShapeDiverExampleModels } from "tickets";
import { useProps } from "@mantine/core";
import { useMemo } from "react";

interface Props extends IAppBuilderSettingsSession {
	/** Name of example model */
	example?: string;
}

const defaultProps: Partial<Props> = {
	
};

/**
 * Use default session settings. In case no session settings are provided, 
 * the hook will use settings defined in section "DefaultSession" of the theme.
 * @param props 
 * @returns 
 */
export default function useDefaultSessionDto(props: Partial<Props>) {

	const { example, id = "default", ticket, modelViewUrl, slug, ...rest } = useProps("DefaultSession", defaultProps, props);

	const defaultSessionDto: IAppBuilderSettingsSession | undefined = useMemo(() => example ? {
		id,
		...ShapeDiverExampleModels[example],
		...rest
	} : ticket && modelViewUrl ? {
		id,
		ticket,
		modelViewUrl,
		...rest
	} : slug ? {
		id,
		slug,
		modelViewUrl: "",
		...rest
	} : undefined, [example, id, ticket, modelViewUrl, slug]);

	return {
		defaultSessionDto
	};
}
