import {useSessionPropsParameter} from "@AppBuilderLib/entities/parameter/model/useSessionPropsParameter";
import AcceptRejectButtons from "@AppBuilderLib/entities/parameter/ui/AcceptRejectButtons";
import {
	IUseSessionDto,
	useSession,
} from "@AppBuilderLib/entities/session/model/useSession";
import ViewportComponent from "@AppBuilderLib/entities/viewport/ui/ViewportComponent";
import {IAppBuilderSettingsSession} from "@AppBuilderLib/features/appbuilder/config/appbuilder";
import TabsComponent, {
	ITabsComponentProps,
} from "@AppBuilderLib/shared/ui/tabs/TabsComponent";
import ParametersAndExportsAccordionComponent from "@AppBuilderLib/widgets/appbuilder/ui/ParametersAndExportsAccordionComponent";
import {Grid} from "@mantine/core";
import {SESSION_SETTINGS_MODE} from "@shapediver/viewer.session";
import React, {useMemo} from "react";
import {ExampleModels} from "tickets";
import ExamplePage from "~/pages/examples/ExamplePage";
import classes from "./MultipleViewportPage.module.css";

/**
 * Function that creates the view page.
 * The multiple viewports and sessions in the main component. The sessions are connected via its id to the ParameterUiComponent and ExportUiComponent.
 *
 * @returns
 */
export default function MultipleViewportPage() {
	const sessionSideboardKey = "Sideboard";
	const sessionBookshelfKey = "Bookshelf";

	const sessionsCreateDto: {
		[key: string]: IUseSessionDto & IAppBuilderSettingsSession;
	} = {
		[sessionSideboardKey]: {
			id: ExampleModels[sessionSideboardKey].slug,
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

	const parameterBenchProps = useSessionPropsParameter(
		sessionsCreateDto[sessionSideboardKey].id,
	);
	const parameterBookshelfProps = useSessionPropsParameter(
		sessionsCreateDto[sessionBookshelfKey].id,
	);

	const viewports = [
		...(
			[sessionSideboardKey, sessionSideboardKey] as Array<
				keyof typeof sessionsCreateDto
			>
		).map((sessionName, i) => {
			const sessionCreateDto = sessionsCreateDto[sessionName];

			return (
				<Grid.Col
					span={6}
					key={`${sessionCreateDto.id}_${i}`}
					style={{height: "50%"}}
				>
					<ViewportComponent
						id={`viewport_multiple_${i}`}
						sessionSettingsId={sessionCreateDto.id}
						sessionSettingsMode={SESSION_SETTINGS_MODE.MANUAL}
					/>
				</Grid.Col>
			);
		}),
		...(
			[sessionBookshelfKey, sessionBookshelfKey] as Array<
				keyof typeof sessionsCreateDto
			>
		).map((sessionName, i) => {
			const sessionCreateDto = sessionsCreateDto[sessionName];

			return (
				<Grid.Col
					span={6}
					key={`${sessionCreateDto.id}_${i + 2}`}
					style={{height: "50%"}}
				>
					<ViewportComponent
						id={`viewport_multiple_${i + 2}`}
						sessionSettingsId={sessionCreateDto.id}
						sessionSettingsMode={SESSION_SETTINGS_MODE.MANUAL}
					/>
				</Grid.Col>
			);
		}),
	];

	const tabProps: ITabsComponentProps = useMemo(() => {
		return {
			defaultValue: "Bench",
			tabs: [
				{
					name: "Bench",
					icon: "tabler:adjustments-horizontal",
					children: [
						<ParametersAndExportsAccordionComponent
							key={0}
							parameters={parameterBenchProps}
							defaultGroupName="Bench parameters"
							topSection={
								<AcceptRejectButtons
									parameters={parameterBenchProps}
								/>
							}
						/>,
					],
				},
				{
					name: "Bookshelf",
					icon: "tabler:download",
					children: [
						<ParametersAndExportsAccordionComponent
							key={0}
							parameters={parameterBookshelfProps}
							defaultGroupName="Bookshelf parameters"
							topSection={
								<AcceptRejectButtons
									parameters={parameterBookshelfProps}
								/>
							}
						/>,
					],
				},
			],
		};
	}, [parameterBenchProps, parameterBookshelfProps]);

	const aside = <TabsComponent {...tabProps} />;

	return (
		<ExamplePage aside={aside}>
			<Grid className={classes.containerGrid}>{viewports}</Grid>
		</ExamplePage>
	);
}
