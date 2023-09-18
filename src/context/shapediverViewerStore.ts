import { createSession, EXPORT_TYPE, ISessionApi } from "@shapediver/viewer";
import { create } from "zustand";
import { fetchFileWithToken } from "utils/file";
import {
	IExports,
	IMiddlewareMutate,
	IMiddlewareMutateImpl,
	IParameters, ISessionCompare,
	SessionCreateDto, SetterFn,
	shapediverViewerState
} from "types/context/shapediverViewerStore";

const isSetterFunction = function <T>(setter: T | Partial<T> | SetterFn<T>): setter is SetterFn<T> {
	return (setter as SetterFn<T>).apply !== undefined;
};

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
 * Middleware for the parse input store data.
 */
const middlewareImpl: IMiddlewareMutateImpl = (stateCreator) => (set, get, store) => {
	const parsedSet: typeof set = (...args) => {
		let newState = args[0];
		// Support zustand setter options
		if (isSetterFunction(newState)) {
			newState = newState(get()) ;
		}

		const parameters: IParameters = {};
		const exports: IExports = {};

		for (const sessionId in newState.activeSessions) {
			if (Object.hasOwnProperty.call(newState.activeSessions, sessionId)) {
				// Parse parameters of sessions
				parameters[sessionId] = newState.activeSessions[sessionId]?.parameters || {};
				// Parse exports of sessions
				exports[sessionId] = newState.activeSessions[sessionId]?.exports || {};
			}
		}

		newState = {
			...newState,
			parameters,
			exports,
		};

		set(newState, args[1]);
	};

	store.setState = parsedSet;

	return stateCreator(parsedSet, get, store);
};

export const middleware = middlewareImpl as unknown as IMiddlewareMutate;

/**
 * State store for all created viewports and sessions.
 */
export const useShapediverViewerStore = create<shapediverViewerState>(middleware(
	(set, get) => ({
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
				return sessionsDataNew.findIndex((sessionCompareNew) => sessionCompareNew.imprint === sessionCompareExist.imprint) !== -1;
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
		parameters: {},
		parameterPropertyChange: (sessionId, parameterId, property, value) => {
			set((state) => {
				const session = state.activeSessions[sessionId];
				const parameter = state.parameters[sessionId][parameterId];
				const newState = {...state};

				if (session && parameter) {
					parameter[property] = value;
					newState.parameters[sessionId][parameterId][property] = value;
					session.customize();
				}

				return newState;
			});
		},
		exports: {},
		exportRequest: async (sessionId, exportId) => {
			const state = get();
			const session = state.activeSessions[sessionId];
			const exp = state.exports[sessionId][exportId];

			if (!session || !exp) return;

			// request the export
			const response = await exp.request();

			// if the export is a download export, download it
			if (exp.type === EXPORT_TYPE.DOWNLOAD) {
				if (
					response.content &&
					response.content[0] &&
					response.content[0].href
				) {
					await fetchFileWithToken(response.content[0].href, `${response.filename}.${response.content[0].format}`);
				}
			}
		}
	})));
