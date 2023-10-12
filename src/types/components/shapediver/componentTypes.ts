import { PARAMETER_TYPE, EXPORT_TYPE } from "@shapediver/viewer";
import ParameterSliderComponent from "components/shapediver/parameter/ParameterSliderComponent";
import ParameterBooleanComponent from "components/shapediver/parameter/ParameterBooleanComponent";
import ParameterStringComponent from "components/shapediver/parameter/ParameterStringComponent";
import ParameterSelectComponent from "components/shapediver/parameter/ParameterSelectComponent";
import ParameterColorComponent from "components/shapediver/parameter/ParameterColorComponent";
import ParameterFileInputComponent from "components/shapediver/parameter/ParameterFileInputComponent";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";
import { IShapeDiverParamOrExportDefinition } from "types/shapediver/common";
import ExportButtonComponent from "components/shapediver/exports/ExportButtonComponent";
import ExportLabelComponent from "components/shapediver/exports/ExportLabelComponent";


const parameterComponentsMap = {
	[PARAMETER_TYPE.INT]: ParameterSliderComponent,
	[PARAMETER_TYPE.FLOAT]: ParameterSliderComponent,
	[PARAMETER_TYPE.EVEN]: ParameterSliderComponent,
	[PARAMETER_TYPE.ODD]: ParameterSliderComponent,
	[PARAMETER_TYPE.BOOL]: ParameterBooleanComponent,
	[PARAMETER_TYPE.STRING]: ParameterStringComponent,
	[PARAMETER_TYPE.STRINGLIST]: ParameterSelectComponent,
	[PARAMETER_TYPE.COLOR]: ParameterColorComponent,
	[PARAMETER_TYPE.FILE]: ParameterFileInputComponent,
};

export const getParameterComponent = (definition: IShapeDiverParamOrExportDefinition) => {
	const type = definition.type as keyof typeof parameterComponentsMap;

	return parameterComponentsMap[type] || ParameterLabelComponent;
};

const exportComponentsMap = {
	[EXPORT_TYPE.DOWNLOAD]: ExportButtonComponent,
	[EXPORT_TYPE.EMAIL]: ExportButtonComponent,
};

export const getExportComponent = (definition: IShapeDiverParamOrExportDefinition) => {
	const type = definition.type as keyof typeof exportComponentsMap;

	return exportComponentsMap[type] || ExportLabelComponent;
};
