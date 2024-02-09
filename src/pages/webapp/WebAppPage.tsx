import { SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import React, { useState } from "react";
import { useViewerBranding } from "hooks/shapediver/useViewerBranding";
import ViewportAdditionalUIWrapper, { Positions } from "../../components/shapediver/viewport/ViewportAdditionalUIWrapper";
import ViewportIcons from "../../components/shapediver/viewport/ViewportIcons";
import { ShapeDiverExampleModels } from "tickets";
import WebAppTemplatePage from "../templates/WebAppTemplatePage";
import { Button, Container } from "@mantine/core";
import classes from "./WebAppExampleOnePage.module.css";
import useWebAppSettings from "hooks/shapediver/useWebAppSettings";
import { useSessionWithWebApp } from "hooks/shapediver/useSessionWithWebApp";

const VIEWPORT_ID = "viewport_1";
const MODEL_NAME = "WebAppDiagrid";
const SESSION_ID = ShapeDiverExampleModels[MODEL_NAME].slug;
const ACCEPT_REJECT_MODE = true;
const SESSION_DTO = {
	id: SESSION_ID,
	ticket: ShapeDiverExampleModels[MODEL_NAME].ticket,
	modelViewUrl: ShapeDiverExampleModels[MODEL_NAME].modelViewUrl,
	acceptRejectMode: ACCEPT_REJECT_MODE
};

/**
 * Function that creates the view page.
 * The aside (right side) two tabs, one with a ParameterUiComponent and another with an ExportUiComponent
 * and a viewport and session in the main component. The session is connected via its id to the ParameterUiComponent and ExportUiComponent.
 *
 * @returns
 */
export default function WebAppPage() {
	const sectionTopBgColor = "inherit";
	const sectionLeftBgColor = "inherit";
	const sectionRightBgColor = "inherit";
	const sectionBottomBgColor = "inherit";

	const { settings } = useWebAppSettings(SESSION_DTO);
	const sessionDto = settings ? settings.sessions[0] : undefined;
	const { top, bottom, left, right } = useSessionWithWebApp(sessionDto);
	
	const [isTopDisplayed, setIsTopDisplayed] = useState(false);
	const [isLeftDisplayed, setIsLeftDisplayed] = useState(true);
	const [isRightDisplayed, setIsRightDisplayed] = useState(true);
	const [isBottomDisplayed, setIsBottomDisplayed] = useState(true);

	const { branding } = useViewerBranding();

	return (
		<>
			<Button.Group className={classes.buttonsTop}>
				<Button variant="filled" onClick={() => setIsTopDisplayed(!isTopDisplayed)}>Top</Button>
				<Button variant="filled" onClick={() => setIsLeftDisplayed(!isLeftDisplayed)} color="indigo">Left</Button>
				<Button variant="filled" onClick={() => setIsRightDisplayed(!isRightDisplayed)} color="violet">Right</Button>
				<Button variant="filled" onClick={() => setIsBottomDisplayed(!isBottomDisplayed)} color="cyan">Bottom</Button>
			</Button.Group>

			<WebAppTemplatePage
				top={isTopDisplayed ? <Container
					fluid
					className={classes.sectionTop}
					style={{ backgroundColor: sectionTopBgColor }}
				>{top}</Container> : undefined}
				left={isLeftDisplayed ? <Container
					fluid
					className={classes.sectionLeft}
					style={{ backgroundColor: sectionLeftBgColor }}
					p="xs"
				>{left}</Container> : undefined}
				right={isRightDisplayed ? <Container
					fluid
					className={classes.sectionRight}
					style={{ backgroundColor: sectionRightBgColor }}
					p="xs"
				>{right}</Container> : undefined}
				bottom={isBottomDisplayed ? <Container
					fluid
					className={classes.sectionBottom}
					style={{ backgroundColor: sectionBottomBgColor }}
					p="xs"
				>{bottom}</Container> : undefined}
			>
				<ViewportComponent
					id={VIEWPORT_ID}
					sessionSettingsMode={SESSION_SETTINGS_MODE.FIRST}
					showStatistics={true}
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
			</WebAppTemplatePage>
		</>
	);
}
