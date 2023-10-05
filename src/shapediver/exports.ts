import { IExportApi, ISessionApi } from "@shapediver/viewer";
import { ISdReactExport, ISdReactExportActions, ISdReactExportDefinition } from "types/shapediver/export";

class SdReactExport implements ISdReactExport {

	/** The static definition of the export. */
	readonly definition: ISdReactExportDefinition;
	
	/** API of the export. */
	private sessionExport: IExportApi;

	/** Actions that can be taken on the export. */
	private _actions: ISdReactExportActions;

	constructor(session: ISessionApi, exportId: string) {
		const exportApi = session.exports[exportId];
		this.definition = exportApi;
		this.sessionExport = exportApi;
		this._actions = {
			request: async (parameters?: { [key: string]: string }) => {
				return this.sessionExport.request(parameters);
			}
		};
	}

	get actions() {
		return this._actions;
	}

}

export const createSdReactExport = (session: ISessionApi, exportId: string): ISdReactExport  => {
	return new SdReactExport(session, exportId);
};
