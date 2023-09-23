import { createSession, ISessionApi } from "@shapediver/viewer";
import { ISessionCompare, SessionCreateDto, ShapediverStoreViewerState } from "../types/store/shapediverStoreViewer";
import { create } from "zustand";

/**
 * Get the imprint of common parameters of the ISessionApi or SessionCreateDto.
 */
const stringifySessionCommonParameters =  function(parameters: Pick<SessionCreateDto, "excludeViewports" | "id" | "jwtToken" | "modelViewUrl" | "ticket">) {
	return JSON.stringify({
		excludeViewports: parameters.excludeViewports,
		id: parameters.id,
		jwtToken: parameters.jwtToken || "",
		modelViewUrl: parameters.modelViewUrl,
		ticket: parameters.ticket,
	});
};

/**
 * State store for all created viewports and sessions.
 */
export const useShapediverStoreViewer = create<ShapediverStoreViewerState>((set, get) => ({
	activeViewports: {},
	setActiveViewports: (activeViewports) =>
		set((state) => ({
			...state,
			activeViewports
		})),
	activeSessions: {},
	setActiveSessions: (activeSessions) =>
		set((state) => ({
			...state,
			activeSessions
		})),
	activeSessionsGet: () => {
		return get().activeSessions;
	},
	sessionCreate: async (
		{ id, ticket, modelViewUrl, jwtToken, waitForOutputs, loadOutputs, excludeViewports, initialParameterValues }: SessionCreateDto,
		callbacks: {
			onError?: (error: any) => void;
		} = {},
	) => {
		let session: ISessionApi|undefined = undefined;
		try {
			session = await createSession({
				id: id,
				ticket: ticket,
				modelViewUrl: modelViewUrl,
				jwtToken: jwtToken,
				waitForOutputs: waitForOutputs,
				loadOutputs: loadOutputs,
				excludeViewports: excludeViewports,
				initialParameterValues: initialParameterValues
			});
		} catch (e: any) {
			if (callbacks.onError) callbacks.onError(e);
		}

		return set((state) => {
			return {
				...state,
				activeSessions: {
					...state.activeSessions,
					...session ? {[id]: session} : {},
				},
			};
		});
	},
	sessionClose: async (
		sessionId,
		callbacks: {
			onError?: (error: any) => void;
		} = {},) => {
		const { activeSessions } = get();

		let sessionIdDelete: string|undefined = undefined;
		const session = activeSessions[sessionId];

		if (session) {
			try {
				await session.close();
				sessionIdDelete = sessionId;
			} catch (e) {
				if (callbacks.onError) callbacks.onError(e);
			}
		}

		return set((state) => {
			const activeSessions = state.activeSessions;
			if (sessionIdDelete) delete activeSessions[sessionId];

			return {
				...state,
				activeSessions,
			};
		});
	},
	sessionsSync: async (sessionsDto: SessionCreateDto[]) => {
		const { activeSessions, sessionCreate, sessionClose } = get();
		// Helps to skip typescript filter error
		const isSession = (session: ISessionCompare | undefined): session is ISessionCompare => !!session;
		// Get existing sessions
		const sessionsExist: ISessionCompare[] = Object.values(activeSessions).map((session) => session
			? { id: session.id, imprint: stringifySessionCommonParameters(session) }
			: undefined).filter(isSession);
		// Convert SessionCreateDto[] to the ISessionCompare[]
		const sessionsDataNew = sessionsDto.map((sessionDto) => ({ id: sessionDto.id, imprint: stringifySessionCommonParameters(sessionDto), data: sessionDto }));
		// Find sessions to delete
		const sessionsToDelete = sessionsExist.filter((sessionCompareExist) => {
			return sessionsDataNew.findIndex((sessionCompareNew) => {
				return sessionCompareNew.imprint === sessionCompareExist.imprint;
			}) === -1;
		});

		// Find sessions to create
		const sessionsToCreate = sessionsDataNew.filter((sessionCompareNew) => {
			return sessionsExist.findIndex((sessionCompareExist) => sessionCompareExist.imprint === sessionCompareNew.imprint) === -1;
		});

		return Promise.all([
			...sessionsToDelete.map((sessionToDelete) => sessionClose(sessionToDelete.id)),
			...sessionsToCreate.map((sessionDataNew) => sessionCreate(sessionDataNew.data)),
		]);
	},
}
));
