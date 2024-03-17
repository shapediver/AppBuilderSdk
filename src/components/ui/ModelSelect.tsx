import { MultiSelect, Notification } from "@mantine/core";
import { ISelectedModel, useModelSelectStore } from "store/useModelSelectStore";
import React, { useMemo } from "react";
import { IconAlertCircle } from "@tabler/icons-react";
import { ShapeDiverExampleModels } from "tickets";
import { useSessionPropsParameter } from "hooks/shapediver/parameters/useSessionPropsParameter";
import ParametersAndExportsAccordionComponent from "components/shapediver/ui/ParametersAndExportsAccordionComponent";
import { useSessionPropsExport } from "hooks/shapediver/parameters/useSessionPropsExport";
import { useSessions } from "hooks/shapediver/useSessions";
import AcceptRejectButtons from "../shapediver/ui/AcceptRejectButtons";
import TabsComponent, { ITabsComponentProps } from "./TabsComponent";

/**
 * Function that creates a select element in which models can be selected.
 * For each model select, a session is created.
 *
 * @returns
 */
export default function ModelSelect() {

	const { selectedModels, setSelectedModels } = useModelSelectStore((state) => state);
	const acceptRejectMode = true;

	useSessions(selectedModels);

	// callback to handle changes of the model selection
	const handleChange = (values: string[]) => {
		const selectedModels: ISelectedModel[] = values.map(v => {
			return {
				...ShapeDiverExampleModels[v],
				id: ShapeDiverExampleModels[v].slug,
				name: v,
				acceptRejectMode,
				excludeViewports: ["viewport_1"]
			};
		});
		setSelectedModels(selectedModels);
	};

	// show a notification in case no models are selected
	const noModelsNotification = <Notification icon={<IconAlertCircle size={18} />} mt="xs" title="Model Select" withCloseButton={false}>
		Select a model to see it in the viewport!
	</Notification>;

	// create parameter and export panels per model
	const sessionIds = selectedModels.map(m => m.slug);

	// get parameter and export props for all sessions
	const parameterProps = useSessionPropsParameter(sessionIds);
	const exportProps = useSessionPropsExport(sessionIds);

	const tabProps: ITabsComponentProps = useMemo(() => {
		return {
			defaultValue: selectedModels.length === 0 ? "" : selectedModels[0].slug,
			tabs: selectedModels.map(model => {
				return {
					name: model.slug,
					children: [
						<ParametersAndExportsAccordionComponent key={0}
							parameters={parameterProps.filter(p => p.sessionId === model.slug)}
							exports={exportProps.filter(p => p.sessionId === model.slug)}
							topSection={<AcceptRejectButtons parameters={parameterProps}/>}
						/>
					]
				};
			})
		};
	}, [selectedModels, parameterProps, exportProps]);

	const tabs = <TabsComponent {...tabProps} />;

	return (
		<>
			<MultiSelect
				data={Object.keys(ShapeDiverExampleModels)}
				label="Select models"
				placeholder="Pick the models you want to see"
				onChange={handleChange}
			/>
			{ selectedModels.length === 0 && noModelsNotification }
			{ selectedModels.length > 0 && tabs }
		</>
	);
}
