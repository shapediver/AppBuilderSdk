import React, { useEffect, useState } from "react";
import { Select } from "@mantine/core";
import { popularGoogleFonts } from "../../constants";
import { useEditorStore } from "../../store";

export default function FontFamilyPicker() {
	const { schema, setSchema } = useEditorStore();
	const [selectedFont, setSelectedFont] = useState(popularGoogleFonts[0].value);

	useEffect(() => {
		// Load Google Fonts when component mounts or font changes
		const link = document.createElement("link");
		const fontName = selectedFont.split(",")[0].trim();
		link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(" ", "+")}&display=swap`;
		link.rel = "stylesheet";
		document.head.appendChild(link);

		return () => {
			document.head.removeChild(link);
		};
	}, [selectedFont]);

	const handleFontChange = (value: string) => {
		setSelectedFont(value);
		setSchema({...schema, themeOverrides: {...schema.themeOverrides, fontFamily: value}});
	};

	return (
		<Select
			label="Font Family"
			value={selectedFont}
			onChange={(value) => handleFontChange(value || "")}
			data={popularGoogleFonts}
			searchable
		/>
	);
} 