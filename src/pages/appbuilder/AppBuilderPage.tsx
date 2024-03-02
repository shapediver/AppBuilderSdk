import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import React from "react";
import ViewportOverlayWrapper from "../../components/shapediver/viewport/ViewportOverlayWrapper";
import ViewportIcons from "../../components/shapediver/viewport/ViewportIcons";
import { ShapeDiverExampleModels } from "tickets";
import AppBuilderGridTemplatePage from "../templates/AppBuilderGridTemplatePage";
import useAppBuilderSettings from "hooks/shapediver/useAppBuilderSettings";
import { useSessionWithAppBuilder } from "hooks/shapediver/useSessionWithAppBuilder";
import { useSessionPropsParameter } from "hooks/shapediver/parameters/useSessionPropsParameter";
import { useSessionPropsExport } from "hooks/shapediver/parameters/useSessionPropsExport";
import AppBuilderContainerComponent from "components/shapediver/appbuilder/AppBuilderContainerComponent";
import AppBuilderFallbackContainerComponent from "components/shapediver/appbuilder/AppBuilderFallbackContainerComponent";

const VIEWPORT_ID = "viewport_1";

interface Props {
	/** Name of example model which should be loaded by default. */
	example?: string;
	/** Should acceptRejectMode be used for the example model? */
	acceptRejectMode?: boolean;
}

/**
 * Function that creates the web app page.
 *
 * @returns
 */
export default function AppBuilderPage({ example, acceptRejectMode }: Props) {

	const defaultSessionDto = example ? {
		...ShapeDiverExampleModels[example],
		id: ShapeDiverExampleModels[example].slug,
		acceptRejectMode
	} : undefined;

	const { settings } = useAppBuilderSettings(defaultSessionDto);
	const sessionDto = settings ? settings.sessions[0] : undefined;
	const { sessionId, hasAppBuilderOutput, appBuilderData } = useSessionWithAppBuilder(sessionDto);

	// get props for fallback parameters
	const parameterProps = useSessionPropsParameter(sessionId);
	const exportProps = useSessionPropsExport(sessionId);

	// create UI elements for containers
	const containers: { top?: JSX.Element, bottom?: JSX.Element, left?: JSX.Element, right?: JSX.Element } = {
		top: undefined,
		bottom: undefined,
		left: undefined,
		right: undefined,
	};

	if (appBuilderData?.containers) {
		appBuilderData.containers.forEach((container) => {
			containers[container.name] = AppBuilderContainerComponent({...container, sessionId });
		});
	}
	else if ( !hasAppBuilderOutput && (parameterProps.length > 0 || exportProps.length > 0) )
	{
		containers.right = AppBuilderFallbackContainerComponent({parameters: parameterProps, exports: exportProps});
	}

	const show = Object.values(containers).some((c) => c !== undefined);
	
	return (
		show &&	<AppBuilderGridTemplatePage
			top={containers.top}
			left={containers.left}
			right={containers.right}
			bottom={containers.bottom}
		>
			<ViewportComponent
				id={VIEWPORT_ID}
			>
				<ViewportOverlayWrapper>
					<ViewportIcons
						viewportId={VIEWPORT_ID}
					/>
				</ViewportOverlayWrapper>
			</ViewportComponent>
		</AppBuilderGridTemplatePage>
	);
}
