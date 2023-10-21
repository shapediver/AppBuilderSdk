import { MultiSelect, Notification } from "@mantine/core";
import { useModelSelectStore } from "store/useModelSelectStore";
import React, { useEffect, useState } from "react";
import { IconAlertCircle } from "@tabler/icons-react";
import { SessionCreateDto } from "types/store/shapediverStoreViewer";
import { useShapeDiverStoreViewer } from "store/useShapeDiverStoreViewer";

const sessionData: {
    [key: string]: {
        id: string,
        ticket: string,
        modelViewUrl: string
    }
} = {
	"Ring": {
		id: "0",
		ticket: "5f26762cb6a8f87eaacd2add011634a8b24c38a3b9d390986f1aac30a6b8aa5ecc1c2ee566b962097c7c94f3b62ea0aed75e0392d6fbfc3ca79f94feb6ceeb28b274c01f840a2bdab73a0f305af24a879829578c1fd703e267329475d9586dfe985e57127c96b4-2d6cf150663a7b480f6501d17e325861",
		modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com"
	},
	"Bench": {
		id: "1",
		ticket: "b6b127d7e06588addc43443617c1eeea7ea316bef7ad1273cdd0c82d67f89b8dd4a67a327037b0a3ba2f52377c7d0e1b2a5657dd245603b0a3771d650ea4fbdd76e8187dc21ed1824063e4041b60a28747ed5a51e48c5e77d0c683bee53fb01fa53255e24a74ae-3a01cf3d24f8366dd64a0e2dfce4d4fc",
		modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com"
	},
	"Outputs Shelf": {
		id: "2",
		ticket: "340ff308354b56f5cd0a631f668d48d934a38187c50ff049a19fd3565d316307cb042aaebfdccde871a81f5552c58c04907686e51cada8e8ea7878cfde011ff9d494a54acd68ccf39d9ecfac98bb6a9a2521fc9711294949c1557365b64bbce9e44d420d1b0a64-e5fb4e0ba6c4d6e047685318325f3704",
		modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com"
	},
	"Bookshelf": {
		id: "3",
		ticket: "28f8b4597674b28a35a88877eb82f285bb085fa65ddabe3a9968c59cd859d0e1f711f9f8aaaddba56ac4805122aa374adc3376f27fcc02e9e5e6a7951341d7354355d805ecbf7cb8f1b47957ed583ddcf628bc2317a32f6a7dd5ad0d5fd4c6c3ea538f26596fd0-b07caa3ab7ab068ea8effb6e4dec8de7",
		modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com"
	},
};

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
				id: "selected_session_" + selectedModels[i].id,
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
            id: string,
            ticket: string,
            modelViewUrl: string
        }[] = [];

		for (let i = 0; i < values.length; i++) {
			selectedModels.push(sessionData[values[i]]);
		}

		setSelectedModels(selectedModels);
	};

	const noModelsNotification = <Notification icon={<IconAlertCircle size={18} />} mt="xs" title="Model Select" disallowClose>
		Select a model to see it in the viewport!
	</Notification>;

	return (
		<>
			<MultiSelect
				data={Object.keys(sessionData)}
				label="Select a ticket"
				placeholder="Pick the models you want to see"
				readOnly={loading}
				onChange={handleChange}
			/>
			{ selectedModels.length === 0 && noModelsNotification }
		</>
	);
}
