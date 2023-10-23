import { useShapeDiverStoreParameters } from "store/useShapeDiverStoreParameters";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { IParameterChanges } from "types/store/shapediverStoreParameters";

export function useParameterChanges(parameters: PropsParameter[]) {
	
	const sessionIds = parameters.map(p => p.sessionId);

	const parameterChanges = useShapeDiverStoreParameters(state => Object.keys(state.parameterChanges)
		.filter(id => sessionIds.includes(id))
		.reduce((acc, id) => {
			acc.push(state.parameterChanges[id]);
	
			return acc;
		}, [] as IParameterChanges[])
	);
		
	return parameterChanges;
}
