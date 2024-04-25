import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import React, { ReactElement } from "react";
import ViewportOverlayWrapper from "../../components/shapediver/viewport/ViewportOverlayWrapper";
import ViewportIcons from "../../components/shapediver/viewport/ViewportIcons";
import useAppBuilderSettings from "hooks/shapediver/useAppBuilderSettings";
import { useSessionWithAppBuilder } from "hooks/shapediver/useSessionWithAppBuilder";
import { useSessionPropsParameter } from "hooks/shapediver/parameters/useSessionPropsParameter";
import { useSessionPropsExport } from "hooks/shapediver/parameters/useSessionPropsExport";
import AppBuilderContainerComponent from "components/shapediver/appbuilder/AppBuilderContainerComponent";
import AppBuilderFallbackContainerComponent
	from "components/shapediver/appbuilder/AppBuilderFallbackContainerComponent";
import AlertPage from "pages/misc/AlertPage";
import { IAppBuilderSettingsSession } from "types/shapediver/appbuilder";
import useDefaultSessionDto from "hooks/shapediver/useDefaultSessionDto";
import LoaderPage from "pages/misc/LoaderPage";
import MarkdownWidgetComponent from "components/shapediver/ui/MarkdownWidgetComponent";
import AppBuilderTemplateSelector from "pages/templates/AppBuilderTemplateSelector";

const VIEWPORT_ID = "viewport_1";

interface Props extends IAppBuilderSettingsSession {
	/** Name of example model */
	example?: string;
}

/**
 * Function that creates the web app page.
 *
 * @returns
 */
export default function AppBuilderPage(props: Partial<Props>) {
	
	// get default session dto, if any
	const { defaultSessionDto } = useDefaultSessionDto(props);

	// get settings for app builder from query string
	const { settings, error: settingsError, loading, hasSettings } = useAppBuilderSettings(defaultSessionDto);

	// for now we only make use of the first session in the settings
	const sessionDto = settings ? settings.sessions[0] : undefined;
	const { sessionId, error: appBuilderError, hasAppBuilderOutput, appBuilderData } = useSessionWithAppBuilder(sessionDto, settings?.appBuilderOverride);
	const error = settingsError ?? appBuilderError;

	// get props for fallback parameters
	const parameterProps = useSessionPropsParameter(sessionId);
	const exportProps = useSessionPropsExport(sessionId);

	// create UI elements for containers
	const containers: { top?: ReactElement, bottom?: ReactElement, left?: ReactElement, right?: ReactElement } = {
		top: undefined,
		bottom: undefined,
		left: undefined,
		right: undefined,
	};

	// should fallback containers be shown?
	const showFallbackContainers = settings?.settings?.disableFallbackUi !== true;

	if (appBuilderData?.containers) {
		appBuilderData.containers.forEach((container) => {
			containers[container.name] = <AppBuilderContainerComponent sessionId={sessionId} {...container}/>;
		});
	}
	else if ( !hasAppBuilderOutput 
		&& (parameterProps.length > 0 || exportProps.length > 0) 
		&& showFallbackContainers
	)
	{
		containers.right = <AppBuilderFallbackContainerComponent parameters={parameterProps} exports={exportProps}/>;
	}

	const show = Object.values(containers).some((c) => c !== undefined) || !showFallbackContainers;

	const NoSettingsMarkdown = `
## Welcome to the ShapeDiver AppBuilder

This page can be opened directly or embedded in an iframe. 
Use this page in one of the following ways to display your model:

### Provide the slug of your model

Example: 

[${window.location}?slug=react-ar-cube](${window.location}?slug=react-ar-cube)

You need to allow [iframe embedding](https://help.shapediver.com/doc/iframe-settings) for this to work.

This method supports protection of your model by a short lived token. You can use the *Require strong authorization* setting for your model. 
This protection can be enabled in the [Embedding settings](https://help.shapediver.com/doc/setup-domains-for-embedding) for all of your models, 
or individually for each model in the [Developer settings](https://help.shapediver.com/doc/developers-settings).  

### Provide ticket and modelViewUrl

Example:

[${window.location}?ticket=TICKET&modelViewUrl=MODEL_VIEW_URL](${window.location}?ticket=YOUR_TICKET&modelViewUrl=MODEL_VIEW_URL)

You need to allow [direct embedding](https://help.shapediver.com/doc/developers-settings) for this to work. 
Copy the *Embedding ticket* and the *Model view URL* from the [Developer settings](https://help.shapediver.com/doc/developers-settings) of your model,
and replace YOUR_TICKET and MODEL_VIEW_URL in the URL shown above.

**Note:**
This method does **not** support protection of your model by a short lived token. 
You need to disable the *Require strong authorization* setting for your model. 

`;

	const LocalHostMarkdown = window.location.hostname === "localhost" ? `
### Local development

Loading models based on their slug is not supported when developing locally.
Either provide a ticket and modelViewUrl as explained above, or 
create a json file in directory public and use it like this:

[${window.location}?g=example.json](${window.location}?g=example.json)


	` : "";

	return (
		!settings && !loading && !error && !hasSettings ? <AlertPage>
			<MarkdownWidgetComponent>
				{NoSettingsMarkdown + LocalHostMarkdown}
			</MarkdownWidgetComponent>
		</AlertPage> :
			error ? <AlertPage title="Error">{error.message}</AlertPage> :
				loading ? <LoaderPage /> :
					show ? <AppBuilderTemplateSelector
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
					</AppBuilderTemplateSelector>
						: <></>
	);
}
