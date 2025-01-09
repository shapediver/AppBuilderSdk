import React, { useCallback, useState } from "react";
import { ColorInput } from "@mantine/core";
import { useEditorStore } from "../../store";

function generateColorTones(baseColor: string) {
	// Convert hex to RGB
	const r = parseInt(baseColor.slice(1,3), 16);
	const g = parseInt(baseColor.slice(3,5), 16);
	const b = parseInt(baseColor.slice(5,7), 16);

	const tones = Array.from({length: 11}, (_, i) => {
		const factor = i / 10;
		const newR = Math.round(r + (255 - r) * factor);
		const newG = Math.round(g + (255 - g) * factor);
		const newB = Math.round(b + (255 - b) * factor);
		
		return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`.toUpperCase();
	}).reverse();

	return tones;
}

export default function PrimaryColorPicker() {
	const { schema, setSchema } = useEditorStore();
	const [primaryColor, setPrimaryColor] = useState(schema.themeOverrides.colors?.primary[10] || "#000000");

	const handleColorChange = useCallback((color: string) => {
		setPrimaryColor(color);

		const colorTones = generateColorTones(color);
		setSchema({
			...schema,
			themeOverrides: {
				...schema.themeOverrides,
				colors: {
					primary: colorTones
				} as any
			}
		});
	}, [schema, setSchema]);
	
	return (
		<ColorInput
			label="Primary Color"
			value={primaryColor as string}
			onChange={handleColorChange}
		/>
	);
} 