import { IFileParameterApi, ShapeDiverResponseParameter } from "@shapediver/viewer";

/**
 * Check for type IFileParameterApi
 * @param param 
 * @returns 
 */
export function isFileParameter(param: ShapeDiverResponseParameter): param is IFileParameterApi {
	return ("upload" in param);
}
