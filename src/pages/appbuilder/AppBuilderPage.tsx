import { SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import React, { useState } from "react";
import { useViewerBranding } from "hooks/shapediver/useViewerBranding";
import ViewportAdditionalUIWrapper, { Positions } from "../../components/shapediver/viewport/ViewportAdditionalUIWrapper";
import ViewportIcons from "../../components/shapediver/viewport/ViewportIcons";
import { ShapeDiverExampleModels } from "tickets";
import AppBuilderTemplatePage from "../templates/AppBuilderTemplatePage";
import { Button, Container } from "@mantine/core";
import classes from "./AppBuilderPage.module.css";
import useAppBuilderSettings from "hooks/shapediver/useAppBuilderSettings";
import { useSessionWithAppBuilder } from "hooks/shapediver/useSessionWithAppBuilder";

const VIEWPORT_ID = "viewport_1";

interface Props {
	/** Name of example model which should be loaded by default. */
	example?: string;
	/** Should acceptRejectMode be used for the example model? */
	acceptRejectMode?: boolean;
	/** Should buttons for showing/hiding the containers be shown? */
	showContainerButtons?: boolean;
	/** Option to show / hide rendering statistics overlayed to the viewport. */
	showStatistics?: boolean;
}

/**
 * Function that creates the web app page.
 *
 * @returns
 */
export default function AppBuilderPage({ example, acceptRejectMode, showContainerButtons, showStatistics }: Props) {

	const sectionTopBgColor = "inherit";
	const sectionLeftBgColor = "inherit";
	const sectionRightBgColor = "inherit";
	const sectionBottomBgColor = "inherit";

	const defaultSessionDto = example ? {
		...ShapeDiverExampleModels[example],
		id: ShapeDiverExampleModels[example].slug,
		acceptRejectMode
	} : undefined;

	const { settings } = useAppBuilderSettings(defaultSessionDto);
	const sessionDto = settings ? settings.sessions[0] : undefined;
	const { top, bottom, left, right, show } = useSessionWithAppBuilder(sessionDto);
	
	const [isTopDisplayed, setIsTopDisplayed] = useState(false);
	const [isLeftDisplayed, setIsLeftDisplayed] = useState(true);
	const [isRightDisplayed, setIsRightDisplayed] = useState(true);
	const [isBottomDisplayed, setIsBottomDisplayed] = useState(true);

	const { branding } = useViewerBranding();

	return (
		show ? <>
			{showContainerButtons ? <Button.Group className={classes.buttonsTop}>
				<Button variant="filled" onClick={() => setIsTopDisplayed(!isTopDisplayed)}>Top</Button>
				<Button variant="filled" onClick={() => setIsLeftDisplayed(!isLeftDisplayed)} color="indigo">Left</Button>
				<Button variant="filled" onClick={() => setIsRightDisplayed(!isRightDisplayed)} color="violet">Right</Button>
				<Button variant="filled" onClick={() => setIsBottomDisplayed(!isBottomDisplayed)} color="cyan">Bottom</Button>
			</Button.Group> : <></>}

			<AppBuilderTemplatePage
				top={top && isTopDisplayed ? <Container
					fluid
					className={classes.sectionTop}
					style={{ backgroundColor: sectionTopBgColor }}
				>{top}</Container> : undefined}
				left={left && isLeftDisplayed ? <Container
					fluid
					className={classes.sectionLeft}
					style={{ backgroundColor: sectionLeftBgColor }}
					p="xs"
				>{left}</Container> : undefined}
				right={right && isRightDisplayed ? <Container
					fluid
					className={classes.sectionRight}
					style={{ backgroundColor: sectionRightBgColor }}
					p="xs"
				>{right}</Container> : undefined}
				bottom={bottom && isBottomDisplayed ? <Container
					fluid
					className={classes.sectionBottom}
					style={{ backgroundColor: sectionBottomBgColor }}
					p="xs"
				>{bottom}</Container> : undefined}
			>
				<ViewportComponent
					id={VIEWPORT_ID}
					sessionSettingsMode={SESSION_SETTINGS_MODE.FIRST}
					showStatistics={showStatistics}
					branding={branding}
				>
					<ViewportAdditionalUIWrapper position={Positions.TOP_RIGHT}>
						<ViewportIcons
							viewportId={VIEWPORT_ID}
							enableArBtn
							enableFullscreenBtn
							enableZoomBtn
							enableCamerasBtn
						/>
					</ViewportAdditionalUIWrapper>
				</ViewportComponent>
			</AppBuilderTemplatePage>
		</> : null
	);
}
