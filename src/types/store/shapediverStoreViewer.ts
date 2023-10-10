import { ISessionApi, IViewportApi, SessionCreationDefinition } from "@shapediver/viewer";
import {
	ViewportCreationDefinition
} from "@shapediver/viewer.main.creation-control-center/src/interfaces/ICreationControlCenter";

/**
 * We redeclare SessionCreationDefinition to always have an id
 */
export interface SessionCreateDto extends SessionCreationDefinition {
	id: string,
}

export interface ViewportCreateDto extends ViewportCreationDefinition {
	id: string,
}

export interface IShapeDiverStoreViewerSessions {
	[sessionId: string]: ISessionApi;
}

export interface IShapeDiverStoreViewerViewports {
	[viewportId: string]: IViewportApi;
}

export interface IShapeDiverStoreViewerCallbacks {
	onError?: (error: any) => void;
}

/**
 * Interface for the store of viewer-related data.
 */
export interface IShapediverStoreViewer {

	/**
	 * Viewports currently known by the store.
	 */
	viewports: IShapeDiverStoreViewerViewports

	/**
	 * Create a viewport and add it to the store.
	 * @param dto
	 * @returns
	 */
	createViewport: (
		dto: ViewportCreateDto,
		callbacks?: IShapeDiverStoreViewerCallbacks
	) => Promise<void>;

	/**
	 * Close a viewport and remove it from the store.
	 */
	closeViewport: (
		viewportId: string,
		callbacks?: IShapeDiverStoreViewerCallbacks
	) => Promise<void>;

	/**
	 * Sessions currently known by the store.
	 */
	sessions: IShapeDiverStoreViewerSessions

	/**
	 * Create a session and add it to the store.
	 * @param dto
	 * @returns
	 */
	createSession: (
		dto: SessionCreateDto,
		callbacks?: IShapeDiverStoreViewerCallbacks
	) => Promise<void>;

	/**
	 * Close a session and remove it from the store.
	 */
	closeSession: (
		sessionId: string,
		callbacks?: IShapeDiverStoreViewerCallbacks
	) => Promise<void>;

	/**
	 * Synchronize the sessions with the given dtos, create and close sessions as required.
	 * @param sessionsDto
	 * @returns
	 */
	syncSessions: (sessionDtos: SessionCreateDto[]) => Promise<void[]>,
}
