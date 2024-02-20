import React, { useEffect, useRef, useState } from "react";
import classes from "./AppBuilderTemplatePage.module.css";
import { Button, Group, Stack, useProps } from "@mantine/core";

interface Props {
	top?: React.ReactNode;
	left?: React.ReactNode;
	children?: React.ReactNode;
	right?: React.ReactNode;
	bottom?: React.ReactNode;
}

interface StyleProps {
	bgTop: string,
	bgLeft: string,
	bgRight: string,
	bgBottom: string,
	/** Should buttons for showing/hiding the containers be shown? */
	showContainerButtons: boolean;
}

const defaultStyleProps: Partial<StyleProps> = {
	bgTop: "inherit",
	bgLeft: "inherit",
	bgRight: "inherit",
	bgBottom: "inherit",
	showContainerButtons: false,
};

export default function AppBuilderTemplatePage(props: Props & Partial<StyleProps>) {

	const {
		top = undefined,
		left = undefined,
		children = undefined,
		right = undefined,
		bottom = undefined,
	} = props;

	// style properties
	const { 
		bgTop, 
		bgLeft, 
		bgRight, 
		bgBottom,
		showContainerButtons,
	} = useProps("AppBuilderTemplatePage", defaultStyleProps, props);

	const [isTopDisplayed, setIsTopDisplayed] = useState(!!top);
	const [isLeftDisplayed, setIsLeftDisplayed] = useState(!!left);
	const [isRightDisplayed, setIsRightDisplayed] = useState(!!right);
	const [isBottomDisplayed, setIsBottomDisplayed] = useState(!!bottom);

	const rootRef = useRef<HTMLDivElement>(null);
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

		//console.debug("gridTemplateAreas", gridTemplateAreas);

		return {
			gridTemplateAreas,
		};
	};

	useEffect(() => {
		setRootStyle(generateLayoutStyles(
			showContainerButtons ? isTopDisplayed : !!top, 
			showContainerButtons ? isLeftDisplayed : !!left,
			showContainerButtons ? isRightDisplayed : !!right,
			showContainerButtons ? isBottomDisplayed : !!bottom
		));
	}, [left, right, bottom, top, isTopDisplayed, isLeftDisplayed, isRightDisplayed, isBottomDisplayed, showContainerButtons]);

	return (
		<>
			{showContainerButtons ? <Button.Group className={classes.buttonsTop}>
				<Button variant="filled" onClick={() => setIsTopDisplayed(!isTopDisplayed)}>Top</Button>
				<Button variant="filled" onClick={() => setIsLeftDisplayed(!isLeftDisplayed)} color="indigo">Left</Button>
				<Button variant="filled" onClick={() => setIsRightDisplayed(!isRightDisplayed)} color="violet">Right</Button>
				<Button variant="filled" onClick={() => setIsBottomDisplayed(!isBottomDisplayed)} color="cyan">Bottom</Button>
			</Button.Group> : <></>}

			<section ref={rootRef} className={`${classes.appBuilderTemplatePage} viewer-fullscreen-area`} style={rootStyle}>

				{ top && isTopDisplayed ? <section className={classes.appBuilderTemplatePageTop} style={{background: bgTop}}><Group
					w="100%"
					h="100%"
					justify="center"
					wrap="nowrap"
					p="xs"
				>{top}</Group></section> : undefined }

				{ left && isLeftDisplayed ? <section className={classes.appBuilderTemplatePageLeft} style={{background: bgLeft}}><Stack
					p="xs"
				>{left}</Stack></section> : undefined }

				{ right && isRightDisplayed ? <section className={classes.appBuilderTemplatePageRight} style={{background: bgRight}}><Stack
					p="xs"
				>{right}</Stack></section> : undefined }

				{ bottom && isBottomDisplayed ? <section className={classes.appBuilderTemplatePageBottom} style={{background: bgBottom}}><Group
					w="100%"
					h="100%"
					justify="center"
					wrap="nowrap"
					p="xs"
				>{bottom}</Group></section> : undefined }

				<section
					className={classes.appBuilderTemplatePageMain}
				>
					{ children || <></> }
				</section>
			</section>
		</>
	);
}
