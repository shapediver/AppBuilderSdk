import { SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import React from "react";
import { useSession } from "hooks/useSession";
import ExamplePage from "pages/ExamplePage";
import { useMantineBranding } from "hooks/useMantineBranding";
import { Grid, Tabs } from "@mantine/core";
import { IconFileDownload, IconReplace } from "@tabler/icons-react";
import ParametersAndExportsAccordionComponent from "components/shapediver/ui/ParametersAndExportsAccordionComponent";
import { useSessionPropsParameter } from "hooks/useSessionPropsParameter";
import { ShapeDiverExampleModels } from "tickets";
import { useIsMobile } from "hooks/useIsMobile";
import classes from "./MultipleViewportPage.module.css";
import ParametersAndExportsAccordionTab from "../components/shapediver/ui/ParametersAndExportsAccordionTab";

/**
 * Function that creates the view page.
 * The multiple viewports and sessions in the main component. The sessions are connected via its id to the ParameterUiComponent and ExportUiComponent.
 *
 * @returns
 */
export default function ViewPage() {
	const sessionSideboardKey = "Sideboard";
	const sessionBookshelfKey = "Bookshelf";

	const sessionsCreateDto = {
		[sessionSideboardKey]: {
			id:  ShapeDiverExampleModels[sessionSideboardKey].slug,
			ticket: ShapeDiverExampleModels[sessionSideboardKey].ticket,
			modelViewUrl: ShapeDiverExampleModels[sessionSideboardKey].modelViewUrl,
			excludeViewports: ["viewport_multiple_2", "viewport_multiple_3"]
		},
		[sessionBookshelfKey]: {
			id: ShapeDiverExampleModels[sessionBookshelfKey].slug,
			ticket: ShapeDiverExampleModels[sessionBookshelfKey].ticket,
			modelViewUrl: ShapeDiverExampleModels[sessionBookshelfKey].modelViewUrl,
			excludeViewports: ["viewport_multiple_0", "viewport_multiple_1"]
		},
	};

	const { branding } = useMantineBranding();

	useSession({
		...sessionsCreateDto[sessionSideboardKey],
		registerParametersAndExports: true,
	});
	useSession({
		...sessionsCreateDto[sessionBookshelfKey],
		registerParametersAndExports: true,
	});

	const parameterBenchProps = useSessionPropsParameter(sessionsCreateDto[sessionSideboardKey].id);
	const parameterBookshelfProps = useSessionPropsParameter(sessionsCreateDto[sessionBookshelfKey].id);
	const isMobile = useIsMobile();

	const viewports = [
		...([sessionSideboardKey, sessionSideboardKey] as Array<keyof typeof sessionsCreateDto>).map((sessionName, i) => {
			const sessionCreateDto = sessionsCreateDto[sessionName];

			return <Grid.Col span={6} key={`${sessionCreateDto.id}_${i}`} style={{ height: "50%" }}>
				<ViewportComponent
					id={`viewport_multiple_${i}`}
					sessionSettingsId={sessionCreateDto.id}
					sessionSettingsMode={SESSION_SETTINGS_MODE.MANUAL}
					showStatistics={true}
					branding={branding}
				/>
			</Grid.Col>;
		}),
		...([sessionBookshelfKey, sessionBookshelfKey] as Array<keyof typeof sessionsCreateDto>).map((sessionName, i) => {
			const sessionCreateDto = sessionsCreateDto[sessionName];

			return <Grid.Col span={6} key={`${sessionCreateDto.id}_${i + 2}`} style={{ height: "50%" }}>
				<ViewportComponent
					id={`viewport_multiple_${i + 2}`}
					sessionSettingsId={sessionCreateDto.id}
					sessionSettingsMode={SESSION_SETTINGS_MODE.MANUAL}
					showStatistics={true}
					branding={branding}
				/>
			</Grid.Col>;
		})
	];

	const aside = <Tabs defaultValue="bench" className={classes.asideTabs}>
		<Tabs.List>
			<Tabs.Tab value="bench" leftSection={<IconReplace size={14} />}>Bench</Tabs.Tab>
			<Tabs.Tab value="bookshelf" leftSection={<IconFileDownload size={14} />}>Bookshelf</Tabs.Tab>
		</Tabs.List>

		<ParametersAndExportsAccordionTab value="bench" pt={isMobile ? "" : "xs"}>
			<ParametersAndExportsAccordionComponent parameters={parameterBenchProps} defaultGroupName="Bench parameters" />
		</ParametersAndExportsAccordionTab>

		<ParametersAndExportsAccordionTab value="bookshelf" pt={isMobile ? "" : "xs"}>
			<ParametersAndExportsAccordionComponent parameters={parameterBookshelfProps}
				defaultGroupName="Bookshelf parameters" />
		</ParametersAndExportsAccordionTab>
	</Tabs>;

	return (
		<ExamplePage aside={aside}>
			<Grid className={classes.containerGrid}>
				{viewports}
			</Grid>
		</ExamplePage>
	);
}
