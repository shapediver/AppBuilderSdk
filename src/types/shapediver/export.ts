import { ShapeDiverResponseExport, ShapeDiverResponseExportDefinition } from "@shapediver/api.geometry-api-dto-v2";
import { IShapeDiverParamOrExport } from "./common";

/**
 * The static definition of an export.
 * We reuse the definition of the export on the Geometry Backend here.
 */
export type IShapeDiverExportDefinition = ShapeDiverResponseExportDefinition;

/**
 * Actions which can be taken on an export.
 */
export interface IShapeDiverExportActions {
    /**
     * Request the export.
     *
     * @param parameters Parameter values to be used for this export request. Map from parameter id to parameter value. The current value will be used for any parameter not specified.
     *
     * @throws {@type ShapeDiverViewerError}
     */
    request(parameters?: { [key: string]: string }): Promise<ShapeDiverResponseExport>;
}

/**
 * An export including its definition (static properties) and its state.
 */
export interface IShapeDiverExport extends IShapeDiverParamOrExport {

    /** The static definition of the export. */
    readonly definition: IShapeDiverExportDefinition;

    /**
     * Actions which can be taken on the export.
     */
    readonly actions: IShapeDiverExportActions;
}
