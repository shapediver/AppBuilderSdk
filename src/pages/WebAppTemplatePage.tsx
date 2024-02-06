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

	const generateLayoutStyles = (isTop: boolean, isLeft: boolean, isRight: boolean, isBottom: boolean) => {
		const m = "main";
		const t = "top";
		const l = "left";
		const r = "right";
		const b = "bottom";

		const area = [
			[m, m, m, m, m, m],
			[m, m, m, m, m, m],
			[m, m, m, m, m, m],
			[m, m, m, m, m, m],
		];

		if (isTop) {
			area[0] = [t, t, t, t, t, t];
		}

		if (isLeft) {
			area[0][0] = isTop ? t : l;
			area[1][0] = l;
			area[2][0] = l;
			area[3][0] = l;

			if (!isRight) {
				area[0][1] = isTop ? t : l;
				area[1][1] = l;
				area[2][1] = l;
				area[3][1] = l;
			}
		}

		if (isRight) {
			area[0][5] = isTop ? t : r;
			area[1][5] = r;
			area[2][5] = r;
			area[3][5] = r;

			if (!isLeft) {
				area[0][4] = isTop ? t : r;
				area[1][4] = r;
				area[2][4] = r;
				area[3][4] = r;
			}
		}

		if (isBottom) {
			area[3][0] = isLeft ? l : b;
			area[3][1] = (isLeft && !isRight) ? l : b;
			area[3][2] = b;
			area[3][3] = b;
			area[3][4] = (isRight && !isLeft) ? r : b;
			area[3][5] = isRight ? r : b;
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

		console.log("gridTemplateAreas", gridTemplateAreas);

		return {
			gridTemplateAreas,
		};
	};

	useEffect(() => {
		setRootStyle(generateLayoutStyles(!!top, !!left, !!right, !!bottom));
	}, [left, right, bottom, top]);

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
