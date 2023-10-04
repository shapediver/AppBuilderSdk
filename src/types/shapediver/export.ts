import { ShapeDiverResponseExport } from "@shapediver/api.geometry-api-dto-v2";
import { IExportApi } from "@shapediver/viewer";

/**
 * The static definition of an export.
 * We reuse the definition of the export on the Geometry Backend here.
 */
export type ISdReactExportDefinition = IExportApi;

/**
 * An export including its definition (static properties) and its state.
 */
export interface ISdReactExport {

    /** The static definition of a parameter. */
    readonly definition: ISdReactExportDefinition;

    /**
     * Request the export.
     *
     * @param parameters Parameter values to be used for this export request. Map from parameter id to parameter value. The current value will be used for any parameter not specified.
     *
     * @throws {@type ShapeDiverViewerError}
     */
    request(parameters?: { [key: string]: string }): Promise<ShapeDiverResponseExport>;
}
