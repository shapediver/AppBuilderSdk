import { IMaterialStandardDataProperties, SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import React, { useEffect, useState } from "react";
import { useSession } from "hooks/useSession";
import { useMantineBranding } from "hooks/useMantineBranding";
import ViewportAdditionalUIWrapper, { Positions } from "../components/shapediver/viewport/ViewportAdditionalUIWrapper";
import ViewportIcons from "../components/shapediver/viewport/ViewportIcons";
import { ShapeDiverExampleModels } from "tickets";
import { IGenericParameterDefinition } from "types/store/shapediverStoreParameters";
import { useDefineGenericParameters } from "hooks/useDefineGenericParameters";
import { useOutputMaterial } from "hooks/useOutputMaterial";
import WebAppTemplatePage from "./WebAppTemplatePage";
import { Button } from "@mantine/core";
import classes from "./WebAppExampleOnePage.module.css";
import TextWidgetComponent from "../components/shapediver/ui/TextWidgetComponent";
import ImageWidgetComponent from "../components/shapediver/ui/ImageWidgetComponent";
import ParametersAndExportsAccordionComponent from "../components/shapediver/ui/ParametersAndExportsAccordionComponent";
import { useSessionPropsParameter } from "../hooks/useSessionPropsParameter";
import AcceptRejectButtons from "../components/shapediver/ui/AcceptRejectButtons";

/**
 * Function that creates the view page.
 * The aside (right side) two tabs, one with a ParameterUiComponent and another with an ExportUiComponent
 * and a viewport and session in the main component. The session is connected via its id to the ParameterUiComponent and ExportUiComponent.
 *
 * @returns
 */
export default function WebAppExampleOnePage() {
	const viewportId = "viewport_1";
	const modelName = "Sideboard";
	const sessionId = ShapeDiverExampleModels[modelName].slug;
	const sessionCreateDto = {
		id: sessionId,
		ticket: ShapeDiverExampleModels[modelName].ticket,
		modelViewUrl: ShapeDiverExampleModels[modelName].modelViewUrl,
		excludeViewports: ["viewport_2"],
	};
	const acceptRejectMode = true;

	const [isTopDisplayed, setIsTopDisplayed] = useState(true);
	const [isLeftDisplayed, setIsLeftDisplayed] = useState(true);
	const [isRightDisplayed, setIsRightDisplayed] = useState(true);
	const [isBottomDisplayed, setIsBottomDisplayed] = useState(true);

	const { branding } = useMantineBranding();

	// use a session with a ShapeDiver model and register its parameters
	const { sessionApi } = useSession({
		...sessionCreateDto,
		registerParametersAndExports: true,
		acceptRejectMode: acceptRejectMode,
	});

	useEffect(() => {
		if (sessionApi)
			console.debug(`Available output names: ${Object.values(sessionApi.outputs).map(o => o.name)}`);
	}, [sessionApi]);

	/////
	// START - Example on how to apply a custom material to an output
	/////
	const outputNameOrId = "Shelf";

	// define a generic parameter which influences a custom material definition
	const [materialParameters] = useState<IGenericParameterDefinition>({
		definition: {
			id: "myparam",
			name: "Custom color",
			defval: "0xffffffff",
			type: "Color",
			hidden: false
		}
	});
	const [materialProperties, setMaterialProperties] = useState<IMaterialStandardDataProperties>({ color: materialParameters.definition.defval });
	useDefineGenericParameters("mysession", !acceptRejectMode,
		materialParameters,
		(values) => new Promise(resolve => {
			if ("myparam" in values)
				setMaterialProperties({ color: values["myparam"] });

			resolve(values);
		})
	);

	// apply the custom material
	useOutputMaterial(sessionId, outputNameOrId, materialProperties);

	/////
	// END - Example on how to apply a custom material to an output
	/////

	const markdown = `
# Heading level 1
## Heading level 2
### Heading level 3

**bold text**.

Italicized text is the *cat's meow*.

My favorite search engine is [Duck Duck Go](https://duckduckgo.com "The best search engine for privacy").

* Bullet in an unordered list.
`;

	// get parameters that don't have a group or whose group name includes "export"
	const parameterProps = useSessionPropsParameter(sessionId, param => !param.group || !param.group.name.toLowerCase().includes("export"));

	const parameterTabs = <ParametersAndExportsAccordionComponent
		parameters={parameterProps.length > 0 ? parameterProps : []	}
		topSection={<AcceptRejectButtons parameters={parameterProps}/>}
		avoidSingleComponentGroups={true}
	/>;

	return (
		<>
			<Button.Group className={classes.buttonsTop}>
				<Button variant="filled" onClick={() => setIsTopDisplayed(!isTopDisplayed)}>Top</Button>
				<Button variant="filled" onClick={() => setIsLeftDisplayed(!isLeftDisplayed)} color="indigo">Left</Button>
				<Button variant="filled" onClick={() => setIsRightDisplayed(!isRightDisplayed)} color="violet">Right</Button>
				<Button variant="filled" onClick={() => setIsBottomDisplayed(!isBottomDisplayed)} color="cyan">Bottom</Button>
			</Button.Group>

			<WebAppTemplatePage
				top={isTopDisplayed ? <section className={classes.sectionTop}>Top</section> : undefined}
				left={isLeftDisplayed ? <section className={classes.sectionLeft}>
					<TextWidgetComponent>{markdown}</TextWidgetComponent>
				</section> : undefined}
				right={isRightDisplayed ? <section className={classes.sectionRight}>{ parameterTabs }</section> : undefined}
				bottom={isBottomDisplayed ? <section className={classes.sectionBottom}>
					<ImageWidgetComponent
						src="https://img2.storyblok.com/1536x0/filters:format(webp)/f/92524/712x699/7a500f3a9a/sync-your-favorite-design-software-with-shapediver.png"
						w="100%"
						h="100%"
					/></section> : undefined}
			>
				<ViewportComponent
					id={viewportId}
					sessionSettingsMode={SESSION_SETTINGS_MODE.FIRST}
					showStatistics={true}
					branding={branding}
				>
					<ViewportAdditionalUIWrapper position={Positions.TOP_RIGHT}>
						<ViewportIcons
							viewportId={viewportId}
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
