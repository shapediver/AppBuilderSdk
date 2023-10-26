import { useEffect, useRef } from "react";

interface CrossBrowserDocument extends Document {
  webkitFullscreenElement?: Element;
  webkitExitFullscreen?: () => void;

  mozRequestFullScreen?: Element;
  mozExitFullScreen?: () => void;

  msRequestFullscreen?: Element;
  msExitFullScreen?: () => void;
}

const eventsFullScreen = [
	"fullscreenchange",
	"webkitfullscreenchange", // Safari
	"mozfullscreenchange", // Mozilla
	"MSFullscreenChange", // IE11
];

export const useFullscreen = (fullscreenId: string) => {
	const isFullScreenMode = useRef(false);
	const isFullScreenAvailable = useRef(true);
	const cbDocument = useRef({} as CrossBrowserDocument);

	const onFullScreenChange = () => {
		isFullScreenMode.current = !!cbDocument.current.fullscreenElement;
	};

	useEffect(() => {
		cbDocument.current = document;
		const element = cbDocument.current.getElementsByClassName(fullscreenId).item(0);

		if (!element) {
			console.debug(`Fullscreen element with ID ${fullscreenId} not found.`);
			isFullScreenAvailable.current = false;
			
			return;
		}

		eventsFullScreen.forEach((event) => {
			element.addEventListener(event, onFullScreenChange);
		});

		return () => {
			cbDocument.current = document;
			const element = cbDocument.current.getElementsByClassName(fullscreenId).item(0);

			if (element) {
				eventsFullScreen.forEach((event) => {
					element.removeEventListener(event, onFullScreenChange);
				});
			}
		};
	}, [fullscreenId]);

	const makeElementFullscreen = () => {
		if (cbDocument.current.fullscreenElement) {
			cbDocument.current.exitFullscreen();
		} else if (cbDocument.current.webkitFullscreenElement && cbDocument.current.webkitExitFullscreen) { // Safari
			cbDocument.current.webkitExitFullscreen();
		} else if (cbDocument.current.mozRequestFullScreen && cbDocument.current.mozExitFullScreen) { // Firefox
			cbDocument.current.mozExitFullScreen();
		} else if (cbDocument.current.msRequestFullscreen && cbDocument.current.msExitFullScreen) { // IE
			cbDocument.current.msExitFullScreen();
		} else {
			const element = document.getElementsByClassName(fullscreenId).item(0);

			if (!element) {
				console.debug(`Fullscreen element with ID ${fullscreenId} not found.`);
				isFullScreenAvailable.current = false;
				
				return;
			}

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			if (document.documentElement.requestFullscreen) {
				element.requestFullscreen().catch(() => {
					isFullScreenAvailable.current = false;
				});
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
			} else if (element.webkitRequestFullScreen) {
				// If doesn't have default support, check for Safari
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				element.webkitRequestFullScreen().catch(() => {
					isFullScreenAvailable.current = false;
				});
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
			} else if (element.mozRequestFullScreen) {
				// If doesn't have default support, check for Firefox
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				element.mozRequestFullScreen().catch(() => {
					isFullScreenAvailable.current = false;
				});
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
			} else if (element.msRequestFullscreen) {
				// If doesn't have default support, check for IE
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				element.msRequestFullscreen().catch(() => {
					isFullScreenAvailable.current = false;
				});
			} else {
				isFullScreenAvailable.current = false;
			}
		}
	};

	return {
		isFullScreenMode,
		isFullScreenAvailable,
		makeElementFullscreen,
	};
};
