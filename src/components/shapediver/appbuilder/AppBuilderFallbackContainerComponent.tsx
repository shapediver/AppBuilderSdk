import React, { useMemo } from "react";
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

export default function AppBuilderFallbackContainerComponent({ parameters, exports }: Props) {

	const tabProps: ITabsComponentProps = useMemo(() => {
		const tabProps: ITabsComponentProps = {
			defaultValue: "",
			tabs: []
		};
		if (parameters.length > 0) {
			tabProps.defaultValue = "Parameters";
			tabProps.tabs.push({
				name: "Parameters",
				icon: IconTypeEnum.AdjustmentsHorizontal,
				children: [
					<ParametersAndExportsAccordionComponent key={0}
						parameters={parameters}
						topSection={<AcceptRejectButtons parameters={parameters}/>}
					/>
				]
			});
		}
		if (exports.length > 0) {
			tabProps.defaultValue = tabProps.defaultValue || "Exports";
			tabProps.tabs.push({
				name: "Exports",
				icon: IconTypeEnum.Download,
				children: [
					<ParametersAndExportsAccordionComponent key={0}
						exports={exports}
					/>
				]
			});
		}
		
		return tabProps;
	}, [parameters, exports]);

	return <TabsComponent {...tabProps} />;

}
