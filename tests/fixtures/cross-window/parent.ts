import {ToolsApiFactory} from "@AppBuilderLib/features/agent-tools/api/toolsApi";
import {
	TOOLS_API_NAME_AGENT,
	TOOLS_API_NAME_APP,
} from "@AppBuilderLib/features/agent-tools/config/toolsApi";
import {
	DummyECommerceApiActions,
	ECommerceApiFactory,
} from "@AppBuilderLib/features/ecommerce/api/ecommerceapi";

type ParentWindow = Window & {
	__parentReady: boolean;
	__parentError: string | null;
	__agentReady: boolean;
	__agentError: string | null;
	__startToolsApi?: () => Promise<void>;
	__connector?: Awaited<
		ReturnType<typeof ECommerceApiFactory.getConnectorApi>
	>;
	__toolsApi?: Awaited<ReturnType<typeof ToolsApiFactory.getClientApi>>;
};

const page = window as unknown as ParentWindow;
page.__parentReady = false;
page.__parentError = null;
page.__agentReady = false;
page.__agentError = null;

const params = new URLSearchParams(window.location.search);
const appUrl = params.get("app");
const isToolsApi = params.get("api") === "tools";

void (async () => {
	if (!appUrl) {
		throw new Error("Missing app= iframe URL");
	}

	const iframe = document.getElementById("app") as HTMLIFrameElement;
	iframe.src = appUrl;
	await new Promise<void>((resolve, reject) => {
		iframe.addEventListener("load", () => resolve(), {once: true});
		iframe.addEventListener("error", () => reject(), {once: true});
	});
	if (!iframe.contentWindow) {
		throw new Error("Iframe window is not available");
	}

	if (isToolsApi) {
		page.__startToolsApi = async () => {
			page.__toolsApi = await ToolsApiFactory.getClientApi(
				iframe.contentWindow!,
				TOOLS_API_NAME_AGENT,
				TOOLS_API_NAME_APP,
				{timeout: 60_000},
			);
			await page.__toolsApi.peerIsReady;
			page.__agentReady = true;
		};
		page.__parentReady = true;
		return;
	}

	page.__connector = await ECommerceApiFactory.getConnectorApi(
		iframe.contentWindow,
		new DummyECommerceApiActions(),
		"plugin",
		"app",
		{timeout: 60000},
	);
	await page.__connector.peerIsReady;

	page.__parentReady = true;
})().catch((error: unknown) => {
	page.__parentError = String(error instanceof Error ? error.message : error);
});
