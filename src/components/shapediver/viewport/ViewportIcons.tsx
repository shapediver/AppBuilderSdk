import React, { CSSProperties, useState } from "react";
import { IconAugmentedReality, IconZoomIn, IconMaximize, IconVideo } from "@tabler/icons-react";
import { ActionIcon, Menu, Tooltip } from "@mantine/core";
import { useClickEventHandler } from "hooks/useClickEventHandler";
import { IViewportApi } from "@shapediver/viewer";
import { isIPhone } from "utils/navigator";
import { useFullscreen } from "utils/useFullscreen";
import { firstLetterUppercase } from "utils/strings";
import { ActionIconVariant } from "@mantine/core/lib/ActionIcon/ActionIcon.styles";

interface Props {
	color?: string
	colorDisabled?: string
	size?: number,
	style?: CSSProperties | undefined,
	variant?: ActionIconVariant,
	variantDisabled?: ActionIconVariant,
	fullscreenId?: string,
	viewport?: IViewportApi,
	isArBtn?: boolean,
	isZoomBtn?: boolean,
	isFullscreenBtn?: boolean,
	isCamerasBtn?: boolean,
}

export default function ViewportIcons({
	color = "black",
	colorDisabled = "grey",
	variant = "subtle",
	variantDisabled = "transparent",
	size = 32,
	fullscreenId = "viewer-fullscreen-area",
	viewport,
	isArBtn = false,
	isZoomBtn = false,
	isFullscreenBtn = false,
	isCamerasBtn = false,
	style = { display: "flex"},
}: Props) {
	const iconStyle = {
		margin: "3px",
	};

	const isARVisible = viewport ? viewport.enableAR : false;
	const isArDisabled = viewport ? (!viewport.viewableInAR()) : true;

	const onArClick = () => {
		if (!viewport) return;

		viewport.viewInAR();
	};

	const onZoomClick = () => {
		if (!viewport || !viewport.camera) return;

		viewport.camera.zoomTo();
	};

	const onZoomDoubleClick = () => {
		if (!viewport || !viewport.camera) return;

		viewport.camera.reset({});
	};

	const { clickEventHandler: zoomClickHandler } = useClickEventHandler(
		onZoomClick,
		onZoomDoubleClick,
	);

	const isFullscreenDisabled = !isFullscreenBtn || isIPhone();

	const { makeElementFullscreen, isFullScreenAvailable } = useFullscreen(fullscreenId);

	const cameras = (isCamerasBtn && viewport) ? viewport.cameras : {};
	const areNoCameras = Object.keys(cameras).length === 0;

	const [isCamerasMenuOpened, setIsCamerasMenuOpened] = useState(false);

	const onCameraSelect = (cameraId: string) => {
		if (!viewport) return;

		viewport.assignCamera(cameraId);
	};

	const cameraElements = Object.values(cameras).map((camera, i) => {
		return <Menu.Item onClick={() => onCameraSelect(camera.id)} key={i}>{ firstLetterUppercase(camera.name || camera.id )}</Menu.Item>;
	});

	return <section style={style}>

		{ isArBtn && isARVisible && <Tooltip label={isArDisabled ? "AR is unsupported" : "View in AR"}>
			<div>
				<ActionIcon onClick={onArClick} disabled={isArDisabled} size={size} variant={ isArDisabled ? variantDisabled : variant} aria-label="View in AR" style={iconStyle}>
					<IconAugmentedReality color={isArDisabled ? colorDisabled : color} />
				</ActionIcon>
			</div>
		</Tooltip> }

		{ isZoomBtn && <Tooltip label="Zoom extents">
			<ActionIcon onClick={zoomClickHandler} size={size} variant="subtle" aria-label="Zoom extents" style={iconStyle}>
				<IconZoomIn color={color} />
			</ActionIcon>
		</Tooltip> }

		{ isFullscreenBtn && <Tooltip label="Fullscreen">
			<ActionIcon onClick={makeElementFullscreen} disabled={isFullscreenDisabled || !isFullScreenAvailable.current} size={size} variant={(isFullscreenDisabled || !isFullScreenAvailable.current) ? variantDisabled : variant} aria-label="Fullscreen" style={iconStyle}>
				<IconMaximize color={(isFullscreenDisabled || !isFullScreenAvailable.current) ? colorDisabled : color} />
			</ActionIcon>
		</Tooltip> }

		{ isCamerasBtn &&
			<Menu
				opened={isCamerasMenuOpened}
				onChange={setIsCamerasMenuOpened}
				shadow="md"
				width={200}
				position={"bottom-end"}
			>
				<ActionIcon onClick={() => setIsCamerasMenuOpened(!isCamerasMenuOpened)} disabled={areNoCameras} size={size} variant="subtle" aria-label="Cameras" style={iconStyle}>
					<Tooltip disabled={isCamerasMenuOpened} label="Cameras">
						<Menu.Target>
							<IconVideo color={color} />
						</Menu.Target>
					</Tooltip>
				</ActionIcon>
				<Menu.Dropdown>
					{ cameraElements }
				</Menu.Dropdown>
			</Menu>
		}
	</section>;
}
