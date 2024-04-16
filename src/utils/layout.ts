import React, { } from "react";

interface GridLayoutProps {
    hasTop?: boolean;
    hasLeft?: boolean;
    hasRight?: boolean;
    hasBottom?: boolean;
    rows?: number;
    columns?: number;
    topRows?: number;
    leftColumns?: number;
    rightColumns?: number;
    bottomRows?: number;
}

export function createGridLayout(props: GridLayoutProps): React.CSSProperties {

	const { 
		hasTop = false, 
		hasLeft = false, 
		hasRight = false, 
		hasBottom = false, 
		rows = 4, 
		columns = 4, 
		topRows = 1, 
		leftColumns = 1, 
		rightColumns = 1, 
		bottomRows = 1
	} = props;

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

	if (hasTop) {
		for (let j = 0; j < columns; j++) {
			for (let i = 0; i < topRows; i++) {
				area[i][j] = t;
			}
		}
	}

	if (hasBottom) {
		for (let j = 0; j < columns; j++) {
			for (let i = rows - bottomRows; i < rows; i++)
				area[i][j] = b;
		}
	}

	if (hasLeft) {
		for (let i = 0; i < rows; i++) {
			for (let j = 0; j < leftColumns; j++)
				area[i][j] = l;
		}
	}

	if (hasRight) {
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
}
