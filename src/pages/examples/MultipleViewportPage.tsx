import { SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import ViewportComponent from "components/shapediver/viewport/ViewportComponent";
import React from "react";
import { IUseSessionDto, useSession } from "hooks/shapediver/useSession";
import ExamplePage from "pages/templates/ExampleTemplatePage";
import { Grid } from "@mantine/core";
import ParametersAndExportsAccordionComponent from "components/shapediver/ui/ParametersAndExportsAccordionComponent";
import { useSessionPropsParameter } from "hooks/shapediver/parameters/useSessionPropsParameter";
import { ShapeDiverExampleModels } from "tickets";
import classes from "./MultipleViewportPage.module.css";
import AcceptRejectButtons from "../../components/shapediver/ui/AcceptRejectButtons";
import TabsComponent, { ITabsComponentProps } from "components/ui/TabsComponent";
import { IconTypeEnum } from "types/shapediver/icons";

/**
 * Function that creates the view page.
 * The multiple viewports and sessions in the main component. The sessions are connected via its id to the ParameterUiComponent and ExportUiComponent.
 *
 * @returns
 */
export default function MultipleViewportPage() {
	const sessionSideboardKey = "Sideboard";
	const sessionBookshelfKey = "Bookshelf";

	const sessionsCreateDto : { [key: string]: IUseSessionDto } = {
		[sessionSideboardKey]: {
			id:  ShapeDiverExampleModels[sessionSideboardKey].slug,
			ticket: ShapeDiverExampleModels[sessionSideboardKey].ticket,
			modelViewUrl: ShapeDiverExampleModels[sessionSideboardKey].modelViewUrl,
			excludeViewports: ["viewport_multiple_2", "viewport_multiple_3"],
		},
		[sessionBookshelfKey]: {
			id: ShapeDiverExampleModels[sessionBookshelfKey].slug,
			ticket: ShapeDiverExampleModels[sessionBookshelfKey].ticket,
			modelViewUrl: ShapeDiverExampleModels[sessionBookshelfKey].modelViewUrl,
			excludeViewports: ["viewport_multiple_0", "viewport_multiple_1"],
			acceptRejectMode: true,
		},
	};

	useSession({
		...sessionsCreateDto[sessionSideboardKey],
	});
	useSession({
		...sessionsCreateDto[sessionBookshelfKey],
	});

	const parameterBenchProps = useSessionPropsParameter(sessionsCreateDto[sessionSideboardKey].id);
	const parameterBookshelfProps = useSessionPropsParameter(sessionsCreateDto[sessionBookshelfKey].id);
	
	const viewports = [
		...([sessionSideboardKey, sessionSideboardKey] as Array<keyof typeof sessionsCreateDto>).map((sessionName, i) => {
			const sessionCreateDto = sessionsCreateDto[sessionName];

			return <Grid.Col span={6} key={`${sessionCreateDto.id}_${i}`} style={{ height: "50%" }}>
				<ViewportComponent
					id={`viewport_multiple_${i}`}
					sessionSettingsId={sessionCreateDto.id}
					sessionSettingsMode={SESSION_SETTINGS_MODE.MANUAL}
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
				/>
			</Grid.Col>;
		})
	];

	const tabProps: ITabsComponentProps = {
		defaultValue: "Bench",
		tabs: [
			{
				name: "Bench",
				icon: IconTypeEnum.AdjustmentsHorizontal,
				children: [
					<ParametersAndExportsAccordionComponent key={0}
						parameters={parameterBenchProps}
						defaultGroupName="Bench parameters"
						topSection={<AcceptRejectButtons parameters={parameterBenchProps}/>}
					/>
				]
			},
			{
				name: "Bookshelf",
				icon: IconTypeEnum.Download,
				children: [
					<ParametersAndExportsAccordionComponent key={0}
						parameters={parameterBookshelfProps}
						defaultGroupName="Bookshelf parameters"
						topSection={<AcceptRejectButtons parameters={parameterBookshelfProps}/>}
					/>
				]
			}
		]
	};


	const aside = <TabsComponent {...tabProps} />;

	return (
		<ExamplePage aside={aside}>
			<Grid className={classes.containerGrid}>
				{viewports}
			</Grid>
		</ExamplePage>
	);
}
