import { SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import ViewportComponent from "components/shapediver/ViewportComponent";
import React from "react";
import { useSession } from "hooks/useSession";
import { useRegisterSessionParameters } from "hooks/useRegisterSessionParameters";
import ExamplePage from "pages/ExamplePage";
import { useBranding } from "hooks/useViewport";
import { Grid, Tabs } from "@mantine/core";
import { IconFileDownload, IconReplace } from "@tabler/icons-react";
import ParametersAndExportsAccordionComponent from "../components/shapediver/ui/ParametersAndExportsAccordionComponent";
import { useShapeDiverStoreParameters } from "../store/shapediverStoreParameters";

/**
 * Function that creates the view page.
 * The multiple viewports and sessions in the main component. The sessions are connected via its id to the ParameterUiComponent and ExportUiComponent.
 *
 * @returns
 */
export default function ViewPage() {
	const sessionBenchId = "session_multiple_bench";
	const sessionBookshelfId = "session_multiple_bookshelf";

	const sessionsCreateDto = {
		"Bench_1": {
			id: sessionBenchId,
			ticket: "b6b127d7e06588addc43443617c1eeea7ea316bef7ad1273cdd0c82d67f89b8dd4a67a327037b0a3ba2f52377c7d0e1b2a5657dd245603b0a3771d650ea4fbdd76e8187dc21ed1824063e4041b60a28747ed5a51e48c5e77d0c683bee53fb01fa53255e24a74ae-3a01cf3d24f8366dd64a0e2dfce4d4fc",
			modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			excludeViewports: ["viewport_multiple_1", "viewport_multiple_2", "viewport_multiple_3"]
		},
		"Bench_2": {
			id: "sessionBenchId",
			ticket: "b6b127d7e06588addc43443617c1eeea7ea316bef7ad1273cdd0c82d67f89b8dd4a67a327037b0a3ba2f52377c7d0e1b2a5657dd245603b0a3771d650ea4fbdd76e8187dc21ed1824063e4041b60a28747ed5a51e48c5e77d0c683bee53fb01fa53255e24a74ae-3a01cf3d24f8366dd64a0e2dfce4d4fc",
			modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com",
			excludeViewports: ["viewport_multiple_0", "viewport_multiple_2", "viewport_multiple_3"]
		},
		"Bookshelf_1": {
			id: sessionBookshelfId,
			ticket: "28f8b4597674b28a35a88877eb82f285bb085fa65ddabe3a9968c59cd859d0e1f711f9f8aaaddba56ac4805122aa374adc3376f27fcc02e9e5e6a7951341d7354355d805ecbf7cb8f1b47957ed583ddcf628bc2317a32f6a7dd5ad0d5fd4c6c3ea538f26596fd0-b07caa3ab7ab068ea8effb6e4dec8de7",
			modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			excludeViewports: ["viewport_multiple_0", "viewport_multiple_1", "viewport_multiple_3"]
		},
		"Bookshelf_2": {
			id: sessionBookshelfId,
			ticket: "28f8b4597674b28a35a88877eb82f285bb085fa65ddabe3a9968c59cd859d0e1f711f9f8aaaddba56ac4805122aa374adc3376f27fcc02e9e5e6a7951341d7354355d805ecbf7cb8f1b47957ed583ddcf628bc2317a32f6a7dd5ad0d5fd4c6c3ea538f26596fd0-b07caa3ab7ab068ea8effb6e4dec8de7",
			modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
			excludeViewports: ["viewport_multiple_0", "viewport_multiple_1", "viewport_multiple_2"]
		}
	};

	const { branding } = useBranding();
	const { sessionApi: sessionApi_1 } = useSession(sessionsCreateDto["Bench_1"]);
	useSession(sessionsCreateDto["Bench_2"]);
	const { sessionApi: sessionApi_3 } = useSession(sessionsCreateDto["Bookshelf_1"]);
	useSession(sessionsCreateDto["Bookshelf_2"]);

	useRegisterSessionParameters(sessionApi_1);
	useRegisterSessionParameters(sessionApi_3);

	const parameterBenchProps = useShapeDiverStoreParameters(state => Object.keys(state.useParameters(sessionsCreateDto["Bench_1"].id)).map(id => {
		return { sessionId: sessionsCreateDto["Bench_1"].id, parameterId: id };
	}));

	const parameterBookshelfProps = useShapeDiverStoreParameters(state => Object.keys(state.useParameters(sessionsCreateDto["Bookshelf_1"].id)).map(id => {
		return { sessionId: sessionsCreateDto["Bookshelf_1"].id, parameterId: id };
	}));

	const viewports = Object.values(sessionsCreateDto).map((sessionCreateDto, i) => {
		return <Grid.Col span={6} key={`${sessionCreateDto.id}_${i}`} style={{ height: "50%" }}>
			<ViewportComponent
				id={"viewport_multiple_" + i}
				sessionSettingsId={sessionCreateDto.id}
				sessionSettingsMode={SESSION_SETTINGS_MODE.MANUAL}
				showStatistics={true}
				branding={branding}
			/>
		</Grid.Col>;
	});

	const aside = <Tabs defaultValue="bench" style={{ height: "100%" }}>
		<Tabs.List>
			<Tabs.Tab value="bench" icon={<IconReplace size={14} />}>Bench</Tabs.Tab>
			<Tabs.Tab value="bookshelf" icon={<IconFileDownload size={14} />}>Bookshelf</Tabs.Tab>
		</Tabs.List>

		<Tabs.Panel value="bench" pt="xs" style={{ position: "relative", height: "100%" }}>
			<div style={{ height: "calc(100% - 40px)", overflowY: "auto" }}>
				<ParametersAndExportsAccordionComponent parameters={parameterBenchProps} defaultGroupName="Bench parameters" />
			</div>
		</Tabs.Panel>

		<Tabs.Panel value="bookshelf" pt="xs">
			<div style={{ height: "calc(100% - 40px)", overflowY: "auto" }}>
				<ParametersAndExportsAccordionComponent parameters={parameterBookshelfProps}
					defaultGroupName="Bookshelf parameters" />
			</div>
		</Tabs.Panel>
	</Tabs>;

	return (
		<ExamplePage aside={aside}>
			<Grid style={{ height: "100%" }}>
				{viewports}
			</Grid>
		</ExamplePage>
	);
}
