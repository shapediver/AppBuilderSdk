import React, { useEffect, useRef, useState } from "react";
import classes from "./AppBuilderGridTemplatePage.module.css";
import { Button, MantineThemeComponent, useProps } from "@mantine/core";
import AppBuilderContainerWrapper from "./AppBuilderContainerWrapper";
import { createGridLayout } from "utils/layout";

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

	const rootRef = useRef<HTMLDivElement>(null);
	const [rootStyle, setRootStyle] = useState<React.CSSProperties>({
		// We need to define the background color here, because the corresponding element
		// is used for fullscreen mode and would otherwise be transparent (show as black).
		backgroundColor: "var(--mantine-color-body)",
		...(createGridLayout({
			hasTop: showContainerButtons ? isTopDisplayed : !!top, 
			hasLeft: showContainerButtons ? isLeftDisplayed : !!left,
			hasRight: showContainerButtons ? isRightDisplayed : !!right,
			hasBottom: showContainerButtons ? isBottomDisplayed : !!bottom,
			rows, columns, topRows, leftColumns, rightColumns, bottomRows
		})),
	});

	useEffect(() => {
		setRootStyle({
			...rootStyle,
			...(createGridLayout({
				hasTop: showContainerButtons ? isTopDisplayed : !!top, 
				hasLeft: showContainerButtons ? isLeftDisplayed : !!left,
				hasRight: showContainerButtons ? isRightDisplayed : !!right,
				hasBottom: showContainerButtons ? isBottomDisplayed : !!bottom,
				rows, columns, topRows, leftColumns, rightColumns, bottomRows
			}))
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
