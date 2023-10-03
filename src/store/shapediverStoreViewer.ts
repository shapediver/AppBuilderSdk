import { createSession, ISessionApi } from "@shapediver/viewer";
import { SessionCreateDto, IShapediverStoreViewer } from "../types/store/shapediverStoreViewer";
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
const createSessionIdentifier =  function(parameters: Pick<SessionCreateDto, "id" | "jwtToken" | "modelViewUrl" | "ticket" | "guid">) {
	return JSON.stringify({
		id: parameters.id,
		//jwtToken: parameters.jwtToken || "",
		//modelViewUrl: parameters.modelViewUrl,
		//ticket: parameters.ticket,
		//guid: parameters.guid,
	});
};

/**
 * Store of viewer-related data.
 */
export const useShapediverStoreViewer = create<IShapediverStoreViewer>()(devtools((set, get) => ({
	
	activeViewports: {},
	
	/** TODO to be refactored */
	setActiveViewports: (activeViewports) =>
		set((state) => ({
			...state,
			activeViewports
		}), false, "setActiveViewports"),

	sessions: {},

	createSession: async (
		dto: SessionCreateDto,
		callbacks: {
			onError?: (error: any) => void;
		} = {},
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

		return set((state) => {
			return {
				...state, // <-- according to the docs of zustand, this is not necessary at the top level. see https://github.com/pmndrs/zustand/blob/main/docs/guides/immutable-state-and-merging.md
				sessions: {
					...state.sessions,
					...session ? {[session.id]: session} : {},
				},
			};
		}, false, "createSession");
	},

	closeSession: async (
		sessionId,
		callbacks: {
			onError?: (error: any) => void;
		} = {},) => {

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
				...state, // <-- according to the docs of zustand, this is not necessary at the top level. see https://github.com/pmndrs/zustand/blob/main/docs/guides/immutable-state-and-merging.md
				sessions: newSessions,
			};
		}, false, "closeSession");
	},

	syncSessions: async (sessionDtos: SessionCreateDto[]) => {
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

		return Promise.all([
			...sessionsToDelete.map((sessionToDelete) => closeSession(sessionToDelete.id)),
			...sessionsToCreate.map((sessionDataNew) => createSession(sessionDataNew.data)),
		]);
	},
}
), { ...devtoolsSettings, name: "ShapeDiver | Viewer" }));
