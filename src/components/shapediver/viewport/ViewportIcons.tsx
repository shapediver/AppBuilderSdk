import React, { CSSProperties, useState } from "react";
import { IconAugmentedReality, IconZoomIn, IconMaximize, IconVideo } from "@tabler/icons-react";
import { ActionIcon, Menu, Tooltip } from "@mantine/core";
import { useClickEventHandler } from "hooks/useClickEventHandler";
import { isIPhone } from "utils/navigator";
import { useFullscreen } from "utils/useFullscreen";
import { firstLetterUppercase } from "utils/strings";
import { ActionIconVariant } from "@mantine/core/lib/ActionIcon/ActionIcon.styles";
import { useShapeDiverStoreViewer } from "store/useShapeDiverStoreViewer";

interface Props {
	color?: string
	colorDisabled?: string
	size?: number,
	style?: CSSProperties | undefined,
	variant?: ActionIconVariant,
	variantDisabled?: ActionIconVariant,
	fullscreenId?: string,
	viewportId: string,
	enableArBtn?: boolean,
	enableZoomBtn?: boolean,
	enableFullscreenBtn?: boolean,
	enableCamerasBtn?: boolean,
}

export default function ViewportIcons({
	color = "black",
	colorDisabled = "grey",
	variant = "subtle",
	variantDisabled = "transparent",
	size = 32,
	fullscreenId = "viewer-fullscreen-area",
	viewportId,
	enableArBtn = false,
	enableZoomBtn = false,
	enableFullscreenBtn = false,
	enableCamerasBtn = false,
	style = { display: "flex"},
}: Props) {
	const iconStyle = {
		margin: "3px",
	};

	const viewport = useShapeDiverStoreViewer(state => state.viewports[viewportId]);

	const isArEnabled = viewport ? viewport.enableAR : false;
	const isViewableInAr = viewport ? (!viewport.viewableInAR()) : true;

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

	const isFullscreenDisabled = !enableFullscreenBtn || isIPhone();

	const { makeElementFullscreen, isFullScreenAvailable } = useFullscreen(fullscreenId);

	const cameras = (enableCamerasBtn && viewport) ? viewport.cameras : {};
	const noCamerasAvailable = Object.keys(cameras).length === 0;

	const [isCamerasMenuOpened, setIsCamerasMenuOpened] = useState(false);

	const onCameraSelect = (cameraId: string) => {
		if (!viewport) return;

		viewport.assignCamera(cameraId);
	};

	const cameraElements = Object.values(cameras).map((camera, i) => {
		return <Menu.Item onClick={() => onCameraSelect(camera.id)} key={i}>{ firstLetterUppercase(camera.name || camera.id )}</Menu.Item>;
	});

	return <section style={style}>

		{ enableArBtn && isArEnabled && <Tooltip label={isViewableInAr ? "Viewing in AR is not available" : "View in AR"}>
			<div>
				<ActionIcon onClick={onArClick} disabled={isViewableInAr} size={size} variant={isViewableInAr ? variantDisabled : variant} aria-label="View in AR" style={iconStyle}>
					<IconAugmentedReality color={isViewableInAr ? colorDisabled : color} />
				</ActionIcon>
			</div>
		</Tooltip> }

		{ enableZoomBtn && <Tooltip label="Zoom extents">
			<ActionIcon onClick={zoomClickHandler} size={size} variant={variant} aria-label="Zoom extents" style={iconStyle}>
				<IconZoomIn color={color} />
			</ActionIcon>
		</Tooltip> }

		{ enableFullscreenBtn && <Tooltip label="Fullscreen">
			<ActionIcon onClick={makeElementFullscreen} disabled={isFullscreenDisabled || !isFullScreenAvailable.current} size={size} variant={(isFullscreenDisabled || !isFullScreenAvailable.current) ? variantDisabled : variant} aria-label="Fullscreen" style={iconStyle}>
				<IconMaximize color={(isFullscreenDisabled || !isFullScreenAvailable.current) ? colorDisabled : color} />
			</ActionIcon>
		</Tooltip> }

		{ enableCamerasBtn &&
			<Menu
				opened={isCamerasMenuOpened}
				onChange={setIsCamerasMenuOpened}
				shadow="md"
				width={200}
				position={"bottom-end"}
			>
				<ActionIcon onClick={() => setIsCamerasMenuOpened(!isCamerasMenuOpened)} disabled={noCamerasAvailable} size={size} variant={noCamerasAvailable ? variantDisabled : variant} aria-label="Cameras" style={iconStyle}>
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
