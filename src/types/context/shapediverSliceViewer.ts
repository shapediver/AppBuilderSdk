import { ISessionApi, IViewportApi } from "@shapediver/viewer";
import { SessionCreateDto } from "./shapediverStoreCommon";

export type ISessionCompare = { id: string, imprint: string, data?: SessionCreateDto };

export interface ShapediverSliceViewerState {
	activeViewports: {
		[viewportId: string]: Promise<IViewportApi | void>
		;}
	setActiveViewports: (activeViewports: {
		[viewportId: string]: Promise<IViewportApi | void>
	}) => void;
	activeSessions: {
		[sessionId: string]: ISessionApi | undefined
		;}
	setActiveSessions: (activeSessions: {
		[sessionId: string]: ISessionApi | undefined
	}) => void;
	sessionCreate: (dto: SessionCreateDto) => Promise<void>;
	sessionClose: (sessionId: string) => Promise<void>;
	sessionsSync:(sessionsDto: SessionCreateDto[]) => Promise<void[]>,
}
