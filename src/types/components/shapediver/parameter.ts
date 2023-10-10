import { PARAMETER_TYPE } from "@shapediver/viewer";
import ParameterSliderComponent from "components/shapediver/parameter/ParameterSliderComponent";
import ParameterBooleanComponent from "components/shapediver/parameter/ParameterBooleanComponent";
import ParameterStringComponent from "components/shapediver/parameter/ParameterStringComponent";
import ParameterSelectComponent from "components/shapediver/parameter/ParameterSelectComponent";
import ParameterColorComponent from "components/shapediver/parameter/ParameterColorComponent";
import ParameterFileInputComponent from "components/shapediver/parameter/ParameterFileInputComponent";
import { ISdReactParameter } from "types/shapediver/parameter";
import ParameterLabelComponent from "components/shapediver/parameter/ParameterLabelComponent";


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

export const getParameterComponent = (parameter: ISdReactParameter<any>) => {
	const type = parameter.definition.type as keyof typeof parameterComponentsMap;

	return parameterComponentsMap[type] || ParameterLabelComponent;
};
