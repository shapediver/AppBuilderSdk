import { MultiSelect, Notification } from "@mantine/core";
import { useModelSelectStore } from "store/useModelSelectStore";
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
		// const elements: JSX.Element[] = [];
		const sessionsCreateDto: SessionCreateDto[] = [];

		for (let i = 0; i < selectedModels.length; i++) {
			sessionsCreateDto.push({
				id: "selected_session_" + selectedModels[i].slug,
				ticket: selectedModels[i].ticket,
				modelViewUrl: selectedModels[i].modelViewUrl,
				excludeViewports: ["viewport_1"],
			});
		}

		await sessionsSync(sessionsCreateDto);

		setLoading(false);
	};

	useEffect(() => {
		onModelsChange();
	}, [ selectedModels ]);

	useEffect(() => {
		return () => {
			sessionsSync([]);
		};
	}, []);

	// callback for when the value was changed
	const handleChange = (values: string[]) => {
		const selectedModels: {
            slug: string,
            ticket: string,
            modelViewUrl: string
        }[] = [];

		for (let i = 0; i < values.length; i++) {
			selectedModels.push(ShapeDiverExampleModels[values[i]]);
		}

		setSelectedModels(selectedModels);
	};

	const noModelsNotification = <Notification icon={<IconAlertCircle size={18} />} mt="xs" title="Model Select" withCloseButton={false}>
		Select a model to see it in the viewport!
	</Notification>;

	return (
		<>
			<MultiSelect
				data={Object.keys(ShapeDiverExampleModels)}
				label="Select a ticket"
				placeholder="Pick the models you want to see"
				readOnly={loading}
				onChange={handleChange}
			/>
			{ selectedModels.length === 0 && noModelsNotification }
		</>
	);
}
