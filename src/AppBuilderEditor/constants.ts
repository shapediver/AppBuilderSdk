export const defaultThemeOverrides = {
	"fontFamily": "Assistant, sans-serif",
	"colors": {
		"primary": [
			"#FFFFFF",
			"#E6E6E6",
			"#CCCCCC",
			"#B3B3B3",
			"#999999",
			"#808080",
			"#666666",
			"#4D4D4D",
			"#333333",
			"#1A1A1A",
			"#000000"
		]
	},
	"primaryShade": 9,
	"primaryColor": "primary",
	"defaultRadius": 0,
	"white": "#FFFFFF",
	"black": "#121212",
	"spacing": {
		"xs": "16px",
		"sm": "20px",
		"md": "24px",
		"lg": "32px",
		"xl": "40px"
	},
	"lineHeights": {
		"xs": "1",
		"sm": "1.2",
		"md": "1.4",
		"lg": "1.5",
		"xl": "1.6"
	},
	"fontSizes": {
		"xs": "12px",
		"sm": "14px",
		"md": "16px",
		"lg": "18px",
		"xl": "20px"
	},
	"shadows": {
		"xs": "0 1px 3px rgba(0, 0, 0, 0.1)",
		"sm": "0 2px 4px rgba(0, 0, 0, 0.1)",
		"md": "0 4px 6px rgba(0, 0, 0, 0.1)",
		"lg": "0 8px 12px rgba(0, 0, 0, 0.1)",
		"xl": "0 12px 16px rgba(0, 0, 0, 0.1)"
	},
	"autoContrast": true,
	"luminanceThreshold": 0.5,
	"cursorType": "pointer",
	"focusRing": "never",
	"scale": 1,
	"fontSmoothing": true
};

export const defaultSchema = {
	themeOverrides: defaultThemeOverrides,
	sessions: [
		{
			"id": "default",
			"_description": "State management example including a selection parameter",
			"_slug": "testcustomparameters-option2-5-5-4-2",
			"ticket": "e922e6a5ce1a6ad7d5c1ebdc5b26594ffede4368ec74e628fe47d83d21f81f1e226167c22cc1560342de2cb174db6b471677c48336cdc7bb57e98292ea827199d4e2d525aed8e80c9784184628b3e9fd64f6319616fd787c239d4f2f07296478543f089f92e90f-17de8f258400e5738999755e5e95f274",
			"modelViewUrl": "https://sdr8euc1.eu-central-1.shapediver.com",
			"initialParameterValues": {
				"Cube density": "4",
				"Cubes": "6"
			}
		}
	]
};

export const scaleMarks =   [
	{ value: 0.5, label: "0.5x" },
	{ value: 0.75, label: "0.75x" },
	{ value: 1, label: "1x" },
	{ value: 1.25, label: "1.25x" },
	{ value: 1.5, label: "1.5x" },
	{ value: 1.75, label: "1.75x" },
	{ value: 2, label: "2x" }
];

export const radiusOptions =  [
	{ label: "0", value: "0" },
	{ label: "0.3", value: "4.5" },
	{ label: "0.5", value: "7.5" },
	{ label: "0.75", value: "11.25" },
	{ label: "1", value: "15" }
]; 

export const focusRingOptions =  [
	{ value: "auto", label: "Auto" },
	{ value: "always", label: "Always" },
	{ value: "never", label: "Never" }
]; 

export const popularGoogleFonts = [
	{ value: "Assistant, sans-serif", label: "Assistant" },
	{ value: "Anton, sans-serif", label: "Anton" },
	{ value: "Archivo, sans-serif", label: "Archivo" },
	{ value: "Arimo, sans-serif", label: "Arimo" },
	{ value: "Barlow, sans-serif", label: "Barlow" },
	{ value: "Bitter, serif", label: "Bitter" },
	{ value: "Cabin, sans-serif", label: "Cabin" },
	{ value: "Cairo, sans-serif", label: "Cairo" },
	{ value: "Comfortaa, display", label: "Comfortaa" },
	{ value: "Crimson Text, serif", label: "Crimson Text" },
	{ value: "Dancing Script, cursive", label: "Dancing Script" },
	{ value: "Dosis, sans-serif", label: "Dosis" },
	{ value: "Exo 2, sans-serif", label: "Exo 2" },
	{ value: "Fira Sans, sans-serif", label: "Fira Sans" },
	{ value: "Heebo, sans-serif", label: "Heebo" },
	{ value: "Hind, sans-serif", label: "Hind" },
	{ value: "IBM Plex Sans, sans-serif", label: "IBM Plex Sans" },
	{ value: "Josefin Sans, sans-serif", label: "Josefin Sans" },
	{ value: "Kanit, sans-serif", label: "Kanit" },
	{ value: "Karla, sans-serif", label: "Karla" },
	{ value: "Lato, sans-serif", label: "Lato" },
	{ value: "Libre Baskerville, serif", label: "Libre Baskerville" },
	{ value: "Libre Franklin, sans-serif", label: "Libre Franklin" },
	{ value: "Lobster, display", label: "Lobster" },
	{ value: "Manrope, sans-serif", label: "Manrope" },
	{ value: "Merriweather Sans, sans-serif", label: "Merriweather Sans" },
	{ value: "Merriweather, serif", label: "Merriweather" },
	{ value: "Montserrat, sans-serif", label: "Montserrat" },
	{ value: "Mukta, sans-serif", label: "Mukta" },
	{ value: "Mulish, sans-serif", label: "Mulish" },
	{ value: "Noto Sans, sans-serif", label: "Noto Sans" },
	{ value: "Noto Serif, serif", label: "Noto Serif" },
	{ value: "Nunito, sans-serif", label: "Nunito" },
	{ value: "Open Sans, sans-serif", label: "Open Sans" },
	{ value: "Oswald, sans-serif", label: "Oswald" },
	{ value: "Oxygen, sans-serif", label: "Oxygen" },
	{ value: "PT Sans, sans-serif", label: "PT Sans" },
	{ value: "Playfair Display, serif", label: "Playfair Display" },
	{ value: "Poppins, sans-serif", label: "Poppins" },
	{ value: "Prompt, sans-serif", label: "Prompt" },
	{ value: "Quicksand, sans-serif", label: "Quicksand" },
	{ value: "Raleway, sans-serif", label: "Raleway" },
	{ value: "Roboto Condensed, sans-serif", label: "Roboto Condensed" },
	{ value: "Roboto Slab, serif", label: "Roboto Slab" },
	{ value: "Roboto, sans-serif", label: "Roboto" },
	{ value: "Rubik, sans-serif", label: "Rubik" },
	{ value: "Source Code Pro, monospace", label: "Source Code Pro" },
	{ value: "Source Sans Pro, sans-serif", label: "Source Sans Pro" },
	{ value: "Titillium Web, sans-serif", label: "Titillium Web" },
	{ value: "Ubuntu, sans-serif", label: "Ubuntu" },
	{ value: "Work Sans, sans-serif", label: "Work Sans" }
];