import React, { useEffect, useRef, useState } from "react";
import classes from "./AppBuilderGridTemplatePage.module.css";
import { Button, MantineThemeComponent, useProps } from "@mantine/core";
import AppBuilderContainerWrapper from "./AppBuilderContainerWrapper";

interface Props {
	top?: React.ReactNode;
	left?: React.ReactNode;
	children?: React.ReactNode;
	right?: React.ReactNode;
	bottom?: React.ReactNode;
}

interface StyleProps {
	/** top background color */
	bgTop: string;
	/** left background color */
	bgLeft: string;
	/** right background color */
	bgRight: string;
	/** bottom background color */
	bgBottom: string;
	/** Should buttons for showing/hiding the containers be shown? */
	showContainerButtons: boolean;
	/** Number of grid columns */
	columns: number;
	/** Number of grid rows */
	rows: number;
	/** Number of columns for left container */
	leftColumns: number;
	/** Number of columns for right container */
	rightColumns: number;
	/** Number of rows for top container */
	topRows: number;
	/** Number of rows for bottom container */
	bottomRows: number;
}

const defaultStyleProps: StyleProps = {
	bgTop: "transparent",
	bgLeft: "transparent",
	bgRight: "transparent",
	bgBottom: "transparent",
	showContainerButtons: false,
	columns: 4,
	rows: 4,
	leftColumns: 1,
	rightColumns: 1,
	topRows: 1,
	bottomRows: 1,
};

type AppBuilderGridTemplatePageThemePropsType = Partial<StyleProps>;

export function AppBuilderGridTemplatePageThemeProps(props: AppBuilderGridTemplatePageThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

/**
 * Grid layout template page for AppBuilder
 * @param props 
 * @returns 
 */
export default function AppBuilderGridTemplatePage(props: Props & Partial<StyleProps>) {

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
		columns,
		rows,
		leftColumns,
		rightColumns,
		topRows,
		bottomRows,
	} = useProps("AppBuilderGridTemplatePage", defaultStyleProps, props);

	const [isTopDisplayed, setIsTopDisplayed] = useState(!!top);
	const [isLeftDisplayed, setIsLeftDisplayed] = useState(!!left);
	const [isRightDisplayed, setIsRightDisplayed] = useState(!!right);
	const [isBottomDisplayed, setIsBottomDisplayed] = useState(!!bottom);

	const generateLayoutStyles = (isTop: boolean, isLeft: boolean, isRight: boolean, isBottom: boolean) => {
		const m = "main";
		const t = "top";
		const l = "left";
		const r = "right";
		const b = "bottom";

		const area: string[][] = [];
		
		for (let i = 0; i < rows; i++) {
			const row: string[] = [];
			for (let j = 0; j < columns; j++) {
				row.push(m);
			}
			area.push(row);
		}

		if (isTop) {
			for (let j = 0; j < columns; j++) {
				for (let i = 0; i < topRows; i++) {
					area[i][j] = t;
				}
			}
		}

		if (isBottom) {
			for (let j = 0; j < columns; j++) {
				for (let i = rows - bottomRows; i < rows; i++)
					area[i][j] = b;
			}
		}

		if (isLeft) {
			for (let i = 0; i < rows; i++) {
				for (let j = 0; j < leftColumns; j++)
					area[i][j] = l;
			}
		}

		if (isRight) {
			for (let i = 0; i < rows; i++) {
				for (let j = columns - rightColumns; j < columns; j++)
					area[i][j] = r;
			}
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

		// console.debug("gridTemplateAreas", gridTemplateAreas);

		return {
			gridTemplateAreas,
			gridTemplateColumns: `repeat(${columns}, 1fr)`,
			gridTemplateRows: `repeat(${rows}, 1fr)`,
		};
	};

	const rootRef = useRef<HTMLDivElement>(null);
	const [rootStyle, setRootStyle] = useState<React.CSSProperties>({
		// We need to define the background color here, because the corresponding element
		// is used for fullscreen mode and would otherwise be transparent (show as black).
		backgroundColor: "var(--mantine-color-body)",
		...(generateLayoutStyles(
			showContainerButtons ? isTopDisplayed : !!top, 
			showContainerButtons ? isLeftDisplayed : !!left,
			showContainerButtons ? isRightDisplayed : !!right,
			showContainerButtons ? isBottomDisplayed : !!bottom
		)),
	});

	useEffect(() => {
		setRootStyle({
			...rootStyle,
			...(generateLayoutStyles(
				showContainerButtons ? isTopDisplayed : !!top, 
				showContainerButtons ? isLeftDisplayed : !!left,
				showContainerButtons ? isRightDisplayed : !!right,
				showContainerButtons ? isBottomDisplayed : !!bottom
			))
		});
	}, [left, right, bottom, top, 
		isTopDisplayed, isLeftDisplayed, isRightDisplayed, isBottomDisplayed, 
		showContainerButtons,
		columns, rows, leftColumns, rightColumns, topRows, bottomRows
	]);

	return (
		<>
			{showContainerButtons ? <Button.Group className={classes.buttonsTop}>
				<Button variant="filled" onClick={() => setIsTopDisplayed(!isTopDisplayed)}>Top</Button>
				<Button variant="filled" onClick={() => setIsLeftDisplayed(!isLeftDisplayed)} color="indigo">Left</Button>
				<Button variant="filled" onClick={() => setIsRightDisplayed(!isRightDisplayed)} color="violet">Right</Button>
				<Button variant="filled" onClick={() => setIsBottomDisplayed(!isBottomDisplayed)} color="cyan">Bottom</Button>
			</Button.Group> : <></>}

			<section ref={rootRef} className={`${classes.appBuilderTemplatePage} viewer-fullscreen-area`} style={rootStyle}>

				{ top && isTopDisplayed ? <section className={classes.appBuilderTemplatePageTop} style={{background: bgTop}}>
					<AppBuilderContainerWrapper orientation="horizontal" name="top">{top}</AppBuilderContainerWrapper></section> : undefined }

				{ left && isLeftDisplayed ? <section className={classes.appBuilderTemplatePageLeft} style={{background: bgLeft}}>
					<AppBuilderContainerWrapper orientation="vertical" name="left">{left}</AppBuilderContainerWrapper></section> : undefined }

				{ right && isRightDisplayed ? <section className={classes.appBuilderTemplatePageRight} style={{background: bgRight}}>
					<AppBuilderContainerWrapper orientation="vertical" name="right">{right}</AppBuilderContainerWrapper></section> : undefined }

				{ bottom && isBottomDisplayed ? <section className={classes.appBuilderTemplatePageBottom} style={{background: bgBottom}}>
					<AppBuilderContainerWrapper orientation="horizontal" name="bottom">{bottom}</AppBuilderContainerWrapper></section> : undefined }
				
				<section
					className={classes.appBuilderTemplatePageMain}
				>
					{ children || <></> }
				</section>
			</section>
		</>
	);
}
