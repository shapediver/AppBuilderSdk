import { Group, Text } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useParameter } from "hooks/useParameter";
import React from "react";
import { PropsParameter } from "types/components/shapediver/propsParameter";

interface Props extends PropsParameter {
	cancel?: () => void
}

/**
 * Functional component that creates a label for a parameter or .
 *
 * @returns
 */
export default function ParameterLabelComponent({ sessionId, parameterId, cancel}: Props) {
	const { definition } = useParameter<any>(sessionId, parameterId);

	return <Group justify="space-between" w="100%">
		<Text
			style={{ paddingBottom: "0.25rem" }}
			size="sm"
			fw={500}
		>
			{definition.displayname || definition.name}
		</Text>
		{cancel && <IconX size="15" color="red" onClick={cancel} />}
	</Group>;
}
