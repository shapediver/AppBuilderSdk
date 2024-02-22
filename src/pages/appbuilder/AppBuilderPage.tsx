import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import React from "react";
import ViewportOverlayWrapper from "../../components/shapediver/viewport/ViewportOverlayWrapper";
import ViewportIcons from "../../components/shapediver/viewport/ViewportIcons";
import { ShapeDiverExampleModels } from "tickets";
import AppBuilderTemplatePage from "../templates/AppBuilderTemplatePage";
import useUrlSearchParamSettings from "hooks/shapediver/useUrlSearchParamSettings";
import { useSessionWithAppBuilder } from "hooks/shapediver/useSessionWithAppBuilder";

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

	const { settings } = useUrlSearchParamSettings(defaultSessionDto);
	const sessionDto = settings ? settings.sessions[0] : undefined;
	const { top, bottom, left, right, show } = useSessionWithAppBuilder(sessionDto);

	return (
		show && 
		<AppBuilderTemplatePage
			top={top}
			left={left}
			right={right}
			bottom={bottom}
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
		</AppBuilderTemplatePage>
	);
}
