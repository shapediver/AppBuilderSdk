import { useRef } from "react";

export const useClickEventHandler = (
	clickCb = () => {},
	dblClickCb = () => {},
	delay = 300
) => {
	let timer: ReturnType<typeof setTimeout>;
	const clicks = useRef(0);

	return {
		clickEventHandler: () => {
			clicks.current++;

			if (clicks.current === 1) {
				timer = setTimeout(() => {
					clicks.current = 0;
					clickCb();
				}, delay);
			} else {
				clearTimeout(timer);
				clicks.current = 0;
				dblClickCb();
			}
		}
	};
};
