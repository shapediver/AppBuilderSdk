import { ISessionApi, IViewportApi, SessionCreationDefinition } from "@shapediver/viewer";

/**
 * We redeclare SessionCreationDefinition to have always have an id
 */
export interface SessionCreateDto extends SessionCreationDefinition {
	id: string,
}

export interface IShapeDiverStoreViewerSessions {
	[sessionId: string]: ISessionApi;
}

export interface IShapeDiverStoreViewerViewports {
	[viewportId: string]: IViewportApi;
}

/**
 * Interface for the store of viewer-related data.
 */
export interface IShapediverStoreViewer {

	/**
	 * Viewports currently known by the store.
	 * 
	 * TODO SS-7076 refactor this to remove promise
	 * new signature: 
	 * viewports: IShapeDiverStoreViewerViewports (Note: rename to "viewports", remove the prefix "active" !)
	 */
	activeViewports: {
		[viewportId: string]: Promise<IViewportApi | void>
	}

	/**
	 * TODO SS-7076 to be removed when refactoring
	 * instead implement createViewport, closeViewport
	 * 
	 * @param activeViewports 
	 * @returns 
	 */
	setActiveViewports: (activeViewports: {
		[viewportId: string]: Promise<IViewportApi | void>
	}) => void;

	/** 
	 * Sessions currently known by the store.
	 */
	sessions: IShapeDiverStoreViewerSessions

	/**
	 * Create a session and add it to the store.
	 * @param dto 
	 * @returns 
	 */
	createSession: (dto: SessionCreateDto) => Promise<void>;

	/** 
	 * Close a session and remove it from the store.
	 */
	closeSession: (sessionId: string) => Promise<void>;

	/**
	 * Synchronize the sessions with the given dtos, create and close sessions as required. 
	 * @param sessionsDto 
	 * @returns 
	 */
	syncSessions: (sessionDtos: SessionCreateDto[]) => Promise<void[]>,
}
