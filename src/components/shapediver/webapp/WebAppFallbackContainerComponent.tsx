import React from "react";
import TabsComponent, { ITabsComponentProps } from "components/ui/TabsComponent";
import { IconTypeEnum } from "types/shapediver/icons";
import ParametersAndExportsAccordionComponent from "../ui/ParametersAndExportsAccordionComponent";
import AcceptRejectButtons from "../ui/AcceptRejectButtons";
import { PropsParameter } from "types/components/shapediver/propsParameter";
import { PropsExport } from "types/components/shapediver/propsExport";

interface Props {
	parameters: PropsParameter[],
	exports: PropsExport[],
}

export default function WebAppFallbackContainerComponent({ parameters, exports }: Props) {

	const tabProps: ITabsComponentProps = {
		defaultValue: "Parameters",
		tabs: [
			{
				name: "Parameters",
				icon: IconTypeEnum.AdjustmentsHorizontal,
				children: [
					<ParametersAndExportsAccordionComponent key={0}
						parameters={parameters}
						topSection={<AcceptRejectButtons parameters={parameters}/>}
					/>
				]
			},
			{
				name: "Exports",
				icon: IconTypeEnum.Download,
				children: [
					<ParametersAndExportsAccordionComponent key={0}
						exports={exports}
					/>
				]
			}
		]
	};

	return <TabsComponent {...tabProps} />;

}
