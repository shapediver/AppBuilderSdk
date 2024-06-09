import { SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import ViewportComponent from "shared/components/shapediver/viewport/ViewportComponent";
import React, { useMemo } from "react";
import { IUseSessionDto, useSession } from "shared/hooks/shapediver/useSession";
import ExamplePage from "pages/examples/ExamplePage";
import { Grid } from "@mantine/core";
import ParametersAndExportsAccordionComponent from "shared/components/shapediver/ui/ParametersAndExportsAccordionComponent";
import { useSessionPropsParameter } from "shared/hooks/shapediver/parameters/useSessionPropsParameter";
import { ExampleModels } from "tickets";
import classes from "./MultipleViewportPage.module.css";
import AcceptRejectButtons from "../../shared/components/shapediver/ui/AcceptRejectButtons";
import TabsComponent, { ITabsComponentProps } from "shared/components/ui/TabsComponent";
import { IconTypeEnum } from "shared/types/shapediver/icons";

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
			id:  ExampleModels[sessionSideboardKey].slug,
			ticket: ExampleModels[sessionSideboardKey].ticket,
			modelViewUrl: ExampleModels[sessionSideboardKey].modelViewUrl,
			excludeViewports: ["viewport_multiple_2", "viewport_multiple_3"],
		},
		[sessionBookshelfKey]: {
			id: ExampleModels[sessionBookshelfKey].slug,
			ticket: ExampleModels[sessionBookshelfKey].ticket,
			modelViewUrl: ExampleModels[sessionBookshelfKey].modelViewUrl,
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

	const tabProps: ITabsComponentProps = useMemo(() => {
		return {
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
	}, [parameterBenchProps, parameterBookshelfProps]);


	const aside = <TabsComponent {...tabProps} />;

	return (
		<ExamplePage aside={aside}>
			<Grid className={classes.containerGrid}>
				{viewports}
			</Grid>
		</ExamplePage>
	);
}
