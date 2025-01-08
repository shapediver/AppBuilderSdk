import React from "react";
import { Accordion, JsonInput } from "@mantine/core";
import { useEditorStore } from "../store";

export default function JSONPreview() {
	const { schema } = useEditorStore();

	return (
		<Accordion.Item value="json-preview">
			<Accordion.Control>JSON Preview</Accordion.Control>
			<Accordion.Panel>
				<JsonInput
					value={JSON.stringify(schema, null, 2)} 
					rows={10}
					formatOnBlur
					readOnly
				/>
			</Accordion.Panel>
		</Accordion.Item>
	);
} 