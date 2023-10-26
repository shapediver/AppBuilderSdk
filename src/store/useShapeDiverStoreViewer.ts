import { createSession, createViewport, ISessionApi, IViewportApi } from "@shapediver/viewer";
import { SessionCreateDto, IShapeDiverStoreViewer, ViewportCreateDto } from "types/store/shapediverStoreViewer";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { devtoolsSettings } from "./storeSettings";

/**
 * Helper for comparing sessions.
 */
type ISessionCompare = { id: string, identifier: string, dto?: SessionCreateDto };

/**
 * Helper for comparing sessions.
 */
const createSessionIdentifier =  function(parameters: Pick<SessionCreateDto, "id">) {
	return JSON.stringify({
		id: parameters.id,
	});
};

/**
 * Helper for comparing viewports.
 */
const createViewportIdentifier =  function(parameters: Pick<ViewportCreateDto, "id">) {
	return JSON.stringify({
		id: parameters.id,
	});
};

/**
 * Store data related to the ShapeDiver 3D Viewer.
 * @see {@link IShapeDiverStoreViewer}
 */
export const useShapeDiverStoreViewer = create<IShapeDiverStoreViewer>()(devtools((set, get) => ({

	viewports: {},

	createViewport: async (
		dto: ViewportCreateDto,
		callbacks = {},
	) => {
		// in case a viewport with the same identifier exists, skip creating a new one
		const identifier = createViewportIdentifier(dto);
		const { viewports } = get();

		if ( Object.values(viewports).findIndex(v => identifier === createViewportIdentifier(v)) >= 0 )
			return;

		let viewport: IViewportApi|undefined = undefined;

		try {
			viewport = await createViewport(dto);
		} catch (e: any) {
			if (callbacks.onError) callbacks.onError(e);
		}

		set((state) => {
			return {
				viewports: {
					...state.viewports,
					...viewport ? {[viewport.id]: viewport} : {},
				},
			};
		}, false, "createViewport");

		return viewport;
	},

	closeViewport: async (
		viewportId,
		callbacks = {},
	) => {

		const { viewports } = get();
		const viewport = viewports[viewportId];
		if (!viewport) return;

		try {
			await viewport.close();
		} catch (e) {
			if (callbacks.onError) callbacks.onError(e);

			return;
		}

		return set((state) => {
			// create a new object, omitting the session which was closed
			const newViewports : {[id: string]: IViewportApi} = {};
			Object.keys(state.viewports).forEach(id => {
				if (id !== viewportId)
					newViewports[id] = state.viewports[id];
			});

			return {
				viewports: newViewports,
			};
		}, false, "closeViewport");
	},

	sessions: {},

	createSession: async (
		dto: SessionCreateDto,
		callbacks = {},
	) => {
		// in case a session with the same identifier exists, skip creating a new one
		const identifier = createSessionIdentifier(dto);
		const { sessions } = get();
		if ( Object.values(sessions).findIndex(s => identifier === createSessionIdentifier(s)) >= 0 )
			return;

		let session: ISessionApi|undefined = undefined;
		try {
			session = await createSession(dto);
		} catch (e: any) {
			if (callbacks.onError) callbacks.onError(e);
		}

		set((state) => {
			return {
				sessions: {
					...state.sessions,
					...session ? {[session.id]: session} : {},
				},
			};
		}, false, "createSession");

		return session;
	},

	closeSession: async (
		sessionId,
		callbacks = {},
	) => {
		const { sessions } = get();
		const session = sessions[sessionId];
		if (!session) return;

		try {
			await session.close();
		} catch (e) {
			if (callbacks.onError) callbacks.onError(e);
			
			return;
		}

		return set((state) => {
			// create a new object, omitting the session which was closed
			const newSessions : {[id: string]: ISessionApi} = {};
			Object.keys(state.sessions).forEach(id => {
				if (id !== sessionId)
					newSessions[id] = state.sessions[id];
			});

			return {
				sessions: newSessions,
			};
		}, false, "closeSession");
	},

	syncSessions: async (sessionDtos: SessionCreateDto[]) : Promise<(ISessionApi | undefined)[]> => {
		const { sessions, createSession, closeSession } = get();
		// Helps to skip typescript filter error
		const isSession = (session: ISessionCompare | undefined): session is ISessionCompare => !!session;
		// Get existing sessions
		const existingSessionData: ISessionCompare[] = Object.values(sessions).map((session) => session
			? { id: session.id, identifier: createSessionIdentifier(session) }
			: undefined).filter(isSession);
		// Convert SessionCreateDto[] to the ISessionCompare[]
		const requestedSessionData = sessionDtos.map((sessionDto) => ({ id: sessionDto.id, identifier: createSessionIdentifier(sessionDto), data: sessionDto }));
		// Find sessions to delete
		const sessionsToDelete = existingSessionData.filter((sessionCompareExist) => {
			return requestedSessionData.findIndex((sessionCompareNew) => {
				return sessionCompareNew.identifier === sessionCompareExist.identifier;
			}) === -1;
		});

		// Find sessions to create
		const sessionsToCreate = requestedSessionData.filter((sessionCompareNew) => {
			return existingSessionData.findIndex((sessionCompareExist) => sessionCompareExist.identifier === sessionCompareNew.identifier) === -1;
		});

		// promises
		const sessionsToDeletePromises = sessionsToDelete.map((sessionToDelete) => closeSession(sessionToDelete.id));
		const sessionsToCreatePromise = sessionsToCreate.map((sessionDataNew) => createSession(sessionDataNew.data));

		await Promise.all([
			...sessionsToDeletePromises,
			...sessionsToCreatePromise,
		]);

		const sessionApis = get().sessions;

		return sessionDtos.map(dto => sessionApis[dto.id]);
	},
}
), { ...devtoolsSettings, name: "ShapeDiver | Viewer" }));
