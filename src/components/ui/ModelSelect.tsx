import { MultiSelect, Notification, Tabs } from "@mantine/core";
import { ISelectedModel, useModelSelectStore } from "store/useModelSelectStore";
import React, { } from "react";
import { IconAlertCircle } from "@tabler/icons-react";
import { ShapeDiverExampleModels } from "tickets";
import { useSessionPropsParameter } from "hooks/useSessionPropsParameter";
import ParametersAndExportsAccordionComponent from "components/shapediver/ui/ParametersAndExportsAccordionComponent";
import { useSessionPropsExport } from "hooks/useSessionPropsExport";
import { useIsMobile } from "hooks/useIsMobile";
import { useSessions } from "hooks/useSessions";
import classes from "./ModelSelect.module.css";
import ParametersAndExportsAccordionTab from "../shapediver/ui/ParametersAndExportsAccordionTab";

/**
 * Function that creates a select element in which models can be selected.
 * For each model select, a session is created.
 *
 * @returns
 */
export default function ModelSelect() {

	const { selectedModels, setSelectedModels } = useModelSelectStore((state) => state);
	const acceptRejectMode = true;
	const isMobile = useIsMobile();

	useSessions(selectedModels);

	// callback to handle changes of the model selection
	const handleChange = (values: string[]) => {
		const selectedModels: ISelectedModel[] = values.map(v => {
			return {
				...ShapeDiverExampleModels[v],
				id: ShapeDiverExampleModels[v].slug,
				name: v,
				acceptRejectMode,
				registerParametersAndExports: true,
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

	const tabs = selectedModels.length === 0 ? <></> : <Tabs defaultValue={selectedModels[0].slug} className={classes.tabs}>
		<Tabs.List>
			{
				selectedModels.map(model => <Tabs.Tab key={model.slug} value={model.slug}>{model.name}</Tabs.Tab>)
			}
		</Tabs.List>
		{
			selectedModels.map(model =>
				<ParametersAndExportsAccordionTab key={model.slug} value={model.slug} pt={isMobile ? "" : "xs"}>
					<ParametersAndExportsAccordionComponent
						parameters={parameterProps.filter(p => p.sessionId === model.slug)}
						exports={exportProps.filter(p => p.sessionId === model.slug)}
					/>
				</ParametersAndExportsAccordionTab>
			)
		}
	</Tabs>;

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
