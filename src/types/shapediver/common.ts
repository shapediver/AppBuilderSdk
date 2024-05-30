import { ShapeDiverCommonsGroup } from "@shapediver/api.geometry-api-dto-v2/dist/commons/SdCommonsGroup";

export interface IShapeDiverParamOrExportDefinition {

    /** ID of the parameter or export. */
    readonly id: string;

    /** Name of the parameter or export. */
    readonly name: string;

    /** Name to be displayed instead of name. */
    readonly displayname?: string;

    /** Ordering of the parameter or export in client applications. */
    readonly order?: number;

    /** Group of the parameter or export. */
    readonly group?: ShapeDiverCommonsGroup;

    /** Controls whether the parameter or export should be hidden in the UI */
    readonly hidden: boolean;

    /** The type of parameter or export. */
    readonly type: string;
}

/**
 * A parameter or export.
 */
export interface IShapeDiverParamOrExport {

    /** The static definition of a parameter. */
    readonly definition: IShapeDiverParamOrExportDefinition;
}
