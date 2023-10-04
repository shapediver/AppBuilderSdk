import { ISessionApi } from "@shapediver/viewer";
import { ISdReactExport, ISdReactExportDefinition } from "types/shapediver/export";

class SdReactExport implements ISdReactExport {
	/** The static definition of a parameter. */
	readonly definition: ISdReactExportDefinition;
	constructor(session: ISessionApi, exportId: string) {
		this.definition = session.exports[exportId];
	}

	/**
	 * Request the export.
	 *
	 * @param parameters Parameter values to be used for this export request. Map from parameter id to parameter value. The current value will be used for any parameter not specified.
	 *
	 * @throws {@type ShapeDiverViewerError}
	 */
	request = async (parameters?: { [key: string]: string }) => {
		return this.definition.request(parameters);
	}
}

export const createSdReactExport = (session: ISessionApi, exportId: string): ISdReactExport  => {
	return new SdReactExport(session, exportId);
};
