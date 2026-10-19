import {test} from "@playwright/test";
import {scenarioToolsApi} from "../config/scenarioToolsApi";
import {openToolsApiScenario} from "../helpers/openToolsApiScenario";

test.describe(scenarioToolsApi.slug, () => {
	for (const action of scenarioToolsApi.actions) {
		test(action.name, async ({page}) => {
			await openToolsApiScenario(page, scenarioToolsApi);
			await action.run(page, scenarioToolsApi.slug);
		});
	}
});
