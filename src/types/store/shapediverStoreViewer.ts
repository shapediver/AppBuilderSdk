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

/**
 * Interface for the store of viewer-related data.
 */
export interface IShapediverStoreViewer {

	/**
	 * Viewports currently known by the store.
	 * TODO refactor this to remove promise
	 */
	activeViewports: {
		[viewportId: string]: Promise<IViewportApi | void>
	}

	/**
	 * TODO to be removed when refactoring
	 * @param activeViewports 
	 * @returns 
	 */
	setActiveViewports: (activeViewports: {
		[viewportId: string]: Promise<IViewportApi | void>
	}) => void;

	/** 
	 * Sessions currently known by the store.
	 */
	activeSessions: IShapeDiverStoreViewerSessions

	/**
	 * Create a session and add it to the store.
	 * @param dto 
	 * @returns 
	 */
	sessionCreate: (dto: SessionCreateDto) => Promise<void>;

	/** 
	 * Close a session and remove it from the store.
	 */
	sessionClose: (sessionId: string) => Promise<void>;

	/**
	 * Synchronize the sessions with the given dtos, create and close sessions as required. 
	 * @param sessionsDto 
	 * @returns 
	 */
	sessionsSync: (sessionDtos: SessionCreateDto[]) => Promise<void[]>,
}
