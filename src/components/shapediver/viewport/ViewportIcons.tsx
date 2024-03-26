import React, { useState } from "react";
import { IconAugmentedReality, IconZoomIn, IconMaximize, IconVideo } from "@tabler/icons-react";
import { ActionIcon, ActionIconVariant, Loader, Menu, Modal, Tooltip, Text, useProps, MantineStyleProp, Box, MantineThemeComponent } from "@mantine/core";
import { useClickEventHandler } from "hooks/misc/useClickEventHandler";
import { isIPhone } from "utils/navigator";
import { useFullscreen } from "utils/useFullscreen";
import { firstLetterUppercase } from "utils/strings";
import { useShapeDiverStoreViewer } from "store/useShapeDiverStoreViewer";
import { FLAG_TYPE } from "@shapediver/viewer";
import classes from "./ViewportIcons.module.css";

interface Props {
	viewportId: string,
}

interface OptionalProps {
	color: string
	colorDisabled: string
	enableArBtn: boolean,
	enableCamerasBtn: boolean,
	enableFullscreenBtn: boolean,
	enableZoomBtn: boolean,
	fullscreenId: string,
	iconStyle: MantineStyleProp,
	size: number,
	style: MantineStyleProp,
	variant: ActionIconVariant,
	variantDisabled: ActionIconVariant,
}

const defaultProps: OptionalProps = {
	color: "black",
	colorDisabled: "grey",
	enableArBtn: false,
	enableCamerasBtn: false,
	enableFullscreenBtn: false,
	enableZoomBtn: false,
	fullscreenId: "viewer-fullscreen-area",
	iconStyle: { m: "3px" },
	size: 32,
	style: { display: "flex"},
	variant: "subtle",
	variantDisabled: "transparent",
};

type ViewportIconsThemePropsType = Partial<OptionalProps>;

export function ViewportIconsThemeProps(props: ViewportIconsThemePropsType): MantineThemeComponent {
	return {
		defaultProps: props
	};
}

export default function ViewportIcons(props: Props & Partial<OptionalProps>) {

	const { viewportId, ...rest }	= props;
	const {
		color,
		colorDisabled,
		enableArBtn,
		enableCamerasBtn,
		enableFullscreenBtn,
		enableZoomBtn,
		fullscreenId,
		iconStyle,
		size,
		style,
		variant,
		variantDisabled,
	} = useProps("ViewportIcons", defaultProps, rest);

	const viewport = useShapeDiverStoreViewer(state => state.viewports[viewportId]);

	const isArEnabled = viewport ? viewport.enableAR : false;
	const isViewableInAr = viewport ? viewport.viewableInAR() : false;
	const [ arLink, setArLink ] = useState("");
	const [ isArLoading, setIsArLoading ] = useState(false);
	const [ isModalArOpened, setIsModalArOpened ] = useState(false);
	const [ isModalArError, setIsModalArError ] = useState("");

	const onViewInARDesktopLinkRequest = async () => {
		setIsModalArError("");
		setArLink("");

		if (!viewport) return;

		try {
			setIsModalArOpened(true);
			setIsArLoading(true);
			const arLink = await viewport.createArSessionLink();
			setArLink(arLink);
		} catch (e: any) {
			setIsModalArError("Error while creating QR code");
			console.error(e);
		} finally {
			setIsArLoading(false);
		}
	};

	const onArClick = async () => {
		if (!viewport) return;

		if (isViewableInAr) {
			const token = viewport.addFlag(FLAG_TYPE.BUSY_MODE);
			if (viewport.viewableInAR())
				await viewport.viewInAR();
			viewport.removeFlag(token);
		} else {
			await onViewInARDesktopLinkRequest();
		}
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

	return <Box style={style}>

		{ enableArBtn && isArEnabled && <Tooltip label="View in AR">
			<div>
				<ActionIcon onClick={onArClick} disabled={isArLoading} size={size} variant={isViewableInAr ? variantDisabled : variant} aria-label="View in AR" style={iconStyle}>
					<IconAugmentedReality color={isArLoading ? colorDisabled : color} stroke={1}/>
				</ActionIcon>
			</div>
		</Tooltip> }

		{ enableArBtn && <Modal opened={isModalArOpened} onClose={() => setIsModalArOpened(false)} title="Scan the code" centered>
			{ isModalArError
				? <Text c="red">{isModalArError}</Text>
				: <><Text>Scan the QR code below using your mobile device to see the model in AR. The code is compatible with Android and iOS devices.</Text>
					<section className={classes.containerAr}>
						{isArLoading ? <section className={classes.loaderAr}><Loader color="blue" /></section> : <img
							src={arLink}
							height="180px"
							alt="ar_link"
						/> }
					</section>
				</>
			}
		</Modal>}

		{ enableZoomBtn && <Tooltip label="Zoom extents">
			<ActionIcon onClick={zoomClickHandler} size={size} variant={variant} aria-label="Zoom extents" style={iconStyle}>
				<IconZoomIn color={color} stroke={1}/>
			</ActionIcon>
		</Tooltip> }

		{ enableFullscreenBtn && <Tooltip label="Fullscreen">
			<ActionIcon onClick={makeElementFullscreen} disabled={isFullscreenDisabled || !isFullScreenAvailable.current} size={size} variant={(isFullscreenDisabled || !isFullScreenAvailable.current) ? variantDisabled : variant} aria-label="Fullscreen" style={iconStyle}>
				<IconMaximize color={(isFullscreenDisabled || !isFullScreenAvailable.current) ? colorDisabled : color} stroke={1} />
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
							<IconVideo color={color} stroke={1} />
						</Menu.Target>
					</Tooltip>
				</ActionIcon>
				<Menu.Dropdown>
					{ cameraElements }
				</Menu.Dropdown>
			</Menu>
		}
	</Box>;
}
