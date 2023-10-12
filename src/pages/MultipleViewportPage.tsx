import { SESSION_SETTINGS_MODE } from "@shapediver/viewer";
import ViewportComponent from "components/shapediver/ViewportComponent";
import React from "react";
import { useSession } from "hooks/useSession";
import { useRegisterSessionParameters } from "hooks/useRegisterSessionParameters";
import ExamplePage from "pages/ExamplePage";
import { useBranding } from "hooks/useViewport";
import { Grid } from "@mantine/core";

/**
 * Function that creates the view page.
 * The multiple viewports and sessions in the main component. The sessions are connected via its id to the ParameterUiComponent and ExportUiComponent.
 *
 * @returns
 */
export default function ViewPage() {
	const sessionsCreateDto = [
		{
			id: "session_multiple_0",
			ticket: "340ff308354b56f5cd0a631f668d48d934a38187c50ff049a19fd3565d316307cb042aaebfdccde871a81f5552c58c04907686e51cada8e8ea7878cfde011ff9d494a54acd68ccf39d9ecfac98bb6a9a2521fc9711294949c1557365b64bbce9e44d420d1b0a64-e5fb4e0ba6c4d6e047685318325f3704",
			modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
		},
		{
			id: "session_multiple_1",
			ticket: "340ff308354b56f5cd0a631f668d48d934a38187c50ff049a19fd3565d316307cb042aaebfdccde871a81f5552c58c04907686e51cada8e8ea7878cfde011ff9d494a54acd68ccf39d9ecfac98bb6a9a2521fc9711294949c1557365b64bbce9e44d420d1b0a64-e5fb4e0ba6c4d6e047685318325f3704",
			modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
		},
		{
			id: "session_multiple_2",
			ticket: "340ff308354b56f5cd0a631f668d48d934a38187c50ff049a19fd3565d316307cb042aaebfdccde871a81f5552c58c04907686e51cada8e8ea7878cfde011ff9d494a54acd68ccf39d9ecfac98bb6a9a2521fc9711294949c1557365b64bbce9e44d420d1b0a64-e5fb4e0ba6c4d6e047685318325f3704",
			modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
		},
		{
			id: "session_multiple_3",
			ticket: "340ff308354b56f5cd0a631f668d48d934a38187c50ff049a19fd3565d316307cb042aaebfdccde871a81f5552c58c04907686e51cada8e8ea7878cfde011ff9d494a54acd68ccf39d9ecfac98bb6a9a2521fc9711294949c1557365b64bbce9e44d420d1b0a64-e5fb4e0ba6c4d6e047685318325f3704",
			modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com",
		},
	];

	const { branding } = useBranding();
	const { sessionApi: sessionApi_1 } = useSession(sessionsCreateDto[0]);
	const { sessionApi: sessionApi_2 } = useSession(sessionsCreateDto[1]);
	const { sessionApi: sessionApi_3 } = useSession(sessionsCreateDto[2]);
	const { sessionApi: sessionApi_4 } = useSession(sessionsCreateDto[3]);

	useRegisterSessionParameters(sessionApi_1);
	useRegisterSessionParameters(sessionApi_2);
	useRegisterSessionParameters(sessionApi_3);
	useRegisterSessionParameters(sessionApi_4);

	const viewports = sessionsCreateDto.map((sessionCreateDto, i) => {
		return <Grid.Col span={12} lg={6} key={sessionCreateDto.id} style={{height: "50%"}}>
			<ViewportComponent
				id={"viewport_multiple_" + i}
				sessionSettingsId={sessionCreateDto.id}
				sessionSettingsMode={SESSION_SETTINGS_MODE.MANUAL}
				showStatistics={true}
				branding={branding}
			/>
		</Grid.Col>;
	});

	return (
		<ExamplePage>
			<Grid style={{height: "100%"}}>
				{ viewports }
			</Grid>
		</ExamplePage>
	);
}
