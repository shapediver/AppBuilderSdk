import {test} from "@playwright/test";
import {scenarioECommerceApi} from "../config/scenarioECommerceApi";
import {openCrossWindowScenario} from "../helpers/crossWindowParent";

test.describe(scenarioECommerceApi.slug, () => {
	for (const action of scenarioECommerceApi.actions) {
		test(action.name, async ({page}) => {
			await openCrossWindowScenario(page, scenarioECommerceApi);
			await action.run(page, scenarioECommerceApi.slug);
		});
	}
});
