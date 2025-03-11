import AcceptRejectButtons from "@AppBuilderShared/components/shapediver/ui/AcceptRejectButtons";
import ParametersAndExportsAccordionComponent from "@AppBuilderShared/components/shapediver/ui/ParametersAndExportsAccordionComponent";
import ViewportComponent from "@AppBuilderShared/components/shapediver/viewport/ViewportComponent";
import ViewportIcons from "@AppBuilderShared/components/shapediver/viewport/ViewportIcons";
import ViewportOverlayWrapper from "@AppBuilderShared/components/shapediver/viewport/ViewportOverlayWrapper";
import TabsComponent, {
	ITabsComponentProps,
} from "@AppBuilderShared/components/ui/TabsComponent";
import useAppBuilderSettings from "@AppBuilderShared/hooks/shapediver/appbuilder/useAppBuilderSettings";
import useDefaultSessionDto from "@AppBuilderShared/hooks/shapediver/useDefaultSessionDto";
import {useSessionWithCustomUi} from "@AppBuilderShared/hooks/shapediver/useSessionWithCustomUi";
import {IAppBuilderSettingsSession} from "@AppBuilderShared/types/shapediver/appbuilder";
import {IconTypeEnum} from "@AppBuilderShared/types/shapediver/icons";
import React, {useMemo} from "react";
import ExamplePage from "~/pages/examples/ExamplePage";

interface Props extends IAppBuilderSettingsSession {
	/** Name of example model */
	example?: string;
}

/**
 * Function that creates the view page.
 * The aside (right side) two tabs, one with a ParameterUiComponent and another with an ExportUiComponent
 * and a viewport and session in the main component. The session is connected via its id to the ParameterUiComponent and ExportUiComponent.
 *
 * @returns
 */
export default function CustomUiPage(props: Partial<Props>) {
	const {defaultSessionDto} = useDefaultSessionDto(props);
	const {settings} = useAppBuilderSettings(defaultSessionDto);
	const sessionDto = settings ? settings.sessions[0] : undefined;
	const {parameterProps, exportProps} = useSessionWithCustomUi(sessionDto);

	const tabProps: ITabsComponentProps = useMemo(() => {
		return {
			defaultValue: "Parameters",
			tabs: [
				{
					name: "Parameters",
					icon: IconTypeEnum.AdjustmentsHorizontal,
					children: [
						<ParametersAndExportsAccordionComponent
							key={0}
							parameters={parameterProps}
							defaultGroupName="My parameters"
							topSection={
								<AcceptRejectButtons
									parameters={parameterProps}
								/>
							}
						/>,
					],
				},
				{
					name: "Exports",
					icon: IconTypeEnum.Download,
					children: [
						<ParametersAndExportsAccordionComponent
							key={0}
							exports={exportProps}
							defaultGroupName="Exports"
						/>,
					],
				},
			],
		};
	}, [parameterProps, exportProps]);

	const parameterTabs = <TabsComponent {...tabProps} />;

	return (
		<>
			<ExamplePage aside={parameterTabs}>
				<ViewportComponent>
					<ViewportOverlayWrapper>
						<ViewportIcons />
					</ViewportOverlayWrapper>
				</ViewportComponent>
			</ExamplePage>
		</>
	);
}
