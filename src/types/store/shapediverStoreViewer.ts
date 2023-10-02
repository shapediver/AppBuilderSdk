import { ISessionApi, IViewportApi } from "@shapediver/viewer";
import {
	SessionCreationDefinition
} from "@shapediver/viewer.main.creation-control-center/src/interfaces/ICreationControlCenter";

export interface SessionCreateDto extends SessionCreationDefinition {
	id: string,
}

export type ISessionCompare = { id: string, imprint: string, data?: SessionCreateDto };

export interface ShapediverStoreViewerState {
	activeViewports: {
		[viewportId: string]: Promise<IViewportApi | void>
		;}
	setActiveViewports: (activeViewports: {
		[viewportId: string]: Promise<IViewportApi | void>
	}) => void;
	activeSessions: {
		[sessionId: string]: ISessionApi | undefined;
	}
	activeSessionsGet: () => {
		[sessionId: string]: ISessionApi | undefined;
	}
	setActiveSessions: (activeSessions: {
		[sessionId: string]: ISessionApi | undefined
	}) => void;
	sessionCreate: (dto: SessionCreateDto) => Promise<void>;
	sessionClose: (sessionId: string) => Promise<void>;
	sessionsSync:(sessionsDto: SessionCreateDto[]) => Promise<void[]>,
}
