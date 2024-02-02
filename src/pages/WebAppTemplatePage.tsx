import React, { useEffect, useRef, useState } from "react";
import { useMantineTheme } from "@mantine/core";
import { useColorScheme } from "@mantine/hooks";
import classes from "./WebAppTemplatePage.module.css";

interface Props {
	top?: React.ReactNode;
	left?: React.ReactNode;
	children?: React.ReactNode;
	right?: React.ReactNode;
	bottom?: React.ReactNode;
}

export default function WebAppTemplatePage({
	top = undefined,
	left = undefined,
	children = undefined,
	right = undefined,
	bottom = undefined,
}: Props) {
	const scheme = useColorScheme();
	const theme = useMantineTheme();
	const rootRef  = useRef<HTMLDivElement>(null);
	const [rootStyle, setRootStyle] = useState({
		gridTemplateAreas: "'main main main main'",
	});

	const generateLayoutStyles = () => {
		const m = "main";
		const t = "top";
		const l = "left";
		const r = "right";
		const b = "bottom";

		const area = [
			[m, m, m, m],
			[m, m, m, m],
			[m, m, m, m],
			[m, m, m, m],
		];

		if (top) {
			area[0] = [t, t, t, t];
		}

		if (left) {
			area[0][0] = top ? t : l;
			area[1][0] = l;
			area[2][0] = l;
			area[3][0] = l;
		}

		if (right) {
			area[0][3] = top ? t : r;
			area[1][3] = r;
			area[2][3] = r;
			area[3][3] = r;
		}

		if (bottom) {
			area[3][0] = left ? l : b;
			area[3][1] = b;
			area[3][2] = b;
			area[3][3] = right ? r : b;
		}

		let gridTemplateAreas = "";
		let column = "";

		area.forEach((areaRow) => {
			areaRow.forEach((areaCol) => {
				column += `${areaCol} `;
			});
			gridTemplateAreas = gridTemplateAreas.concat(`"${column.trim()}" `);
			column = "";
		});

		gridTemplateAreas = gridTemplateAreas.trim();

		return {
			gridTemplateAreas,
		};
	};

	useEffect(() => {
		setRootStyle(generateLayoutStyles());
	}, [children, left, right, bottom, top]);

	return (
		<>
			<section ref={rootRef} className={classes.webAppTemplatePage} style={rootStyle}>
				{ top && <section className={classes.webAppTemplatePageTop}>{ top }</section> }
				{ left && <section className={classes.webAppTemplatePageLeft}>{ left }</section> }
				{ right && <section className={classes.webAppTemplatePageRight}>{ right }</section> }
				{ bottom && <section className={classes.webAppTemplatePageBottom}>{ bottom }</section> }
				<section
					className={classes.webAppTemplatePageMain}
					style={{ backgroundColor: scheme === "dark" ? theme.colors.dark[8] : theme.colors.gray[0]}}
				>
					{ children || <></> }
				</section>
			</section>
		</>
	);
}
