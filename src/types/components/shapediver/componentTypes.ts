import { EXPORT_TYPE, PARAMETER_TYPE } from "@shapediver/viewer";
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
import { PropsParameter } from "./propsParameter";
import { ReactElement } from "react";

type ComponentsMapType = { [key: string]: {
	/** Parameter component */
	c: (props: PropsParameter) => ReactElement,
	/** Defines whether extra bottom padding is required */
	extraBottomPadding: boolean,
}};

const parameterComponentsMap: ComponentsMapType = {
	[PARAMETER_TYPE.INT]: {c: ParameterSliderComponent, extraBottomPadding: true},
	[PARAMETER_TYPE.FLOAT]: {c: ParameterSliderComponent, extraBottomPadding: true},
	[PARAMETER_TYPE.EVEN]: {c: ParameterSliderComponent, extraBottomPadding: true},
	[PARAMETER_TYPE.ODD]: {c: ParameterSliderComponent, extraBottomPadding: true},
	[PARAMETER_TYPE.BOOL]: {c: ParameterBooleanComponent, extraBottomPadding: false},
	[PARAMETER_TYPE.STRING]: {c: ParameterStringComponent, extraBottomPadding: false},
	[PARAMETER_TYPE.STRINGLIST]: {c: ParameterSelectComponent, extraBottomPadding: false},
	[PARAMETER_TYPE.COLOR]: {c: ParameterColorComponent, extraBottomPadding: false},
	[PARAMETER_TYPE.FILE]: {c: ParameterFileInputComponent, extraBottomPadding: false},
};

export const getParameterComponent = (definition: IShapeDiverParamOrExportDefinition) => {
	const type = definition.type as keyof typeof parameterComponentsMap;

	return {
		component: parameterComponentsMap[type]?.c || ParameterLabelComponent,
		extraBottomPadding: parameterComponentsMap[type]?.extraBottomPadding,
	};
};

const exportComponentsMap = {
	[EXPORT_TYPE.DOWNLOAD]: ExportButtonComponent,
	[EXPORT_TYPE.EMAIL]: ExportButtonComponent,
};

export const getExportComponent = (definition: IShapeDiverParamOrExportDefinition) => {
	const type = definition.type as keyof typeof exportComponentsMap;

	return exportComponentsMap[type] || ExportLabelComponent;
};
