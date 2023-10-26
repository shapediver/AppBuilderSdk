import { MultiSelect, Notification } from "@mantine/core";
import { ISelectedModel, useModelSelectStore } from "store/useModelSelectStore";
import React, { useEffect, useState } from "react";
import { IconAlertCircle } from "@tabler/icons-react";
import { SessionCreateDto } from "types/store/shapediverStoreViewer";
import { useShapeDiverStoreViewer } from "store/useShapeDiverStoreViewer";
import { ShapeDiverExampleModels } from "tickets";

/**
 * Function that creates a select element in which models can be selected.
 * For each model select, a session is created.
 *
 * @returns
 */
export default function ModelSelect() {

	const setSelectedModels = useModelSelectStore((state) => state.setSelectedModels);
	const sessionsSync = useShapeDiverStoreViewer((state) => state.syncSessions);
	const [loading, setLoading] = useState(false);
	const selectedModels = useModelSelectStore(state => state.selectedModels);

	const onModelsChange = async () => {
		setLoading(true);

		// for each selected model, create a SessionComponent
		const sessionsCreateDto: SessionCreateDto[] = selectedModels.map(model => { return {
			id: "selected_session_" + model.slug,
			ticket: model.ticket,
			modelViewUrl: model.modelViewUrl,
			excludeViewports: ["viewport_1"],
		}; });

		await sessionsSync(sessionsCreateDto);

		setLoading(false);
	};

	useEffect(() => {
		onModelsChange();
	}, [ selectedModels ]);

	// callback to handle changes of the model selection
	const handleChange = (values: string[]) => {
		const selectedModels: ISelectedModel[] = values.map(v => ShapeDiverExampleModels[v]);
		setSelectedModels(selectedModels);
	};

	// notification in case no models are selected
	const noModelsNotification = <Notification icon={<IconAlertCircle size={18} />} mt="xs" title="Model Select" withCloseButton={false}>
		Select a model to see it in the viewport!
	</Notification>;

	return (
		<>
			<MultiSelect
				data={Object.keys(ShapeDiverExampleModels)}
				label="Select models"
				placeholder="Pick the models you want to see"
				readOnly={loading}
				onChange={handleChange}
			/>
			{ selectedModels.length === 0 && noModelsNotification }
		</>
	);
}
