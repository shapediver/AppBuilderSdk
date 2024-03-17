import React, { useMemo } from "react";
import { PropsExport } from "types/components/shapediver/propsExport";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { IAppBuilderWidgetPropsAccordion } from "types/shapediver/appbuilder";
import ParametersAndExportsAccordionComponent from "../ui/ParametersAndExportsAccordionComponent";
import AcceptRejectButtons from "../ui/AcceptRejectButtons";


interface Props extends IAppBuilderWidgetPropsAccordion {
	/** 
	 * Default session id to use for parameter and export references that do 
	 * not specify a session id.
	 */
	sessionId: string
}

export default function AppBuilderAccordionWidgetComponent({ sessionId, parameters = [], exports = [], defaultGroupName }: Props) {
	
	const parameterProps: PropsParameter[] = useMemo(() => parameters.map(p => { 
		return { 
			sessionId: p.sessionId ?? sessionId, 
			parameterId: p.name,
			disableIfDirty: p.disableIfDirty,
			acceptRejectMode: !!p.acceptRejectMode,
		}; 
	}), [parameters, sessionId]);

	const exportProps: PropsExport[] = useMemo(() => exports.map(p => { 
		return { 
			sessionId: p.sessionId ?? sessionId, 
			exportId: p.name,
		}; 
	}), [exports, sessionId]);

	return <ParametersAndExportsAccordionComponent
		parameters={parameterProps}
		exports={exportProps}
		defaultGroupName={defaultGroupName}
		topSection={<AcceptRejectButtons parameters={parameterProps}/>}
	/>;
		
}
