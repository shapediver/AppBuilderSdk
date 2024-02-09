import React from "react";
import { PropsExport } from "types/components/shapediver/propsExport";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { IWebAppWidgetPropsAccordion } from "types/shapediver/webapp";
import ParametersAndExportsAccordionComponent from "../ui/ParametersAndExportsAccordionComponent";
import AcceptRejectButtons from "../ui/AcceptRejectButtons";

/**
 * TODO refactor such that sessionId can be specified per parameter and export
 */
interface Props extends IWebAppWidgetPropsAccordion {
	sessionId: string
}

export default function WebAppAccordionWidgetComponent({ sessionId, parameters = [], exports = [], defaultGroupName }: Props) {
	
	const parameterProps: PropsParameter[] = parameters.map(p => { 
		return { 
			sessionId, 
			parameterId: (p.id || p.name)!,
			disableIfDirty: !!p.disableIfDirty,
			acceptRejectMode: !!p.acceptRejectMode,
		}; 
	});

	const exportProps: PropsExport[] = exports.map(p => { 
		return { 
			sessionId, 
			exportId: (p.id || p.name)!,
		}; 
	});

	return <ParametersAndExportsAccordionComponent
		parameters={parameterProps}
		exports={exportProps}
		defaultGroupName={defaultGroupName}
		topSection={<AcceptRejectButtons parameters={parameterProps}/>}
	/>;
		
}
