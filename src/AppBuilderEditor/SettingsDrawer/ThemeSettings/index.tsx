import React from "react";
import { Accordion, Stack, Text, Slider, SegmentedControl, Select, Group, Switch } from "@mantine/core";
import { scaleMarks, radiusOptions, focusRingOptions } from "../../constants";
import { useEditorStore } from "../../store";
import PrimaryColorPicker from "./PrimaryColorPicker";
import FontFamilyPicker from "./FontFamilyPicker";

export default function ThemeSettings() {
	const { schema, setSchema } = useEditorStore();

	const updateTheme = (key: string, value: any) => {
		setSchema({...schema, themeOverrides: {...schema.themeOverrides, [key]: value}});
	};

	return (
		<Accordion.Item value="theme-settings">
			<Accordion.Control>Theme Settings</Accordion.Control>
			<Accordion.Panel>
				<Stack gap="md">
					<FontFamilyPicker />

					<PrimaryColorPicker />
 
					<Stack gap="xs" mb="xs">
						<Text size="sm">Primary Shade</Text> 
						<Slider
							label="Primary Shade"
							value={Number(schema.themeOverrides.primaryShade)}
							onChange={(val) => updateTheme("primaryShade", val)}
							min={0}
							max={9}
							step={1}
							marks={Array.from({length: 10}, (_, i) => ({value: i, label: String(i)}))}
						/>
					</Stack>

					<Group>
						<Stack style={{flex: 1}} gap="xs">
							<Text size="sm">Radius</Text>
							<SegmentedControl
								value={String(schema.themeOverrides.defaultRadius)}
								onChange={(val) => updateTheme("defaultRadius", Number(val))}
								data={radiusOptions}
								fullWidth
							/>
						</Stack>
					</Group>

					<Stack gap="xs" mb="xs">
						<Text size="sm">Scale</Text>
						<Slider
							value={schema.themeOverrides.scale}
							onChange={(val) => updateTheme("scale", val)}
							min={0.5}
							max={2}
							step={0.25}
							marks={scaleMarks}
						/>
					</Stack>

					<Stack>
						<Text size="sm">UI Settings</Text>
						<Group>
							<Switch
								label="Font Smoothing"
								checked={schema.themeOverrides.fontSmoothing}
								onChange={(e) => updateTheme("fontSmoothing", e.currentTarget.checked)}
							/>

							<Select
								label="Focus Ring"
								value={schema.themeOverrides.focusRing}
								onChange={(val) => updateTheme("focusRing", val as string)}
								data={focusRingOptions}
							/>
						</Group>
					</Stack>
				</Stack>
			</Accordion.Panel>
		</Accordion.Item>
	);
} 