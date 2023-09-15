import { createSession, EXPORT_TYPE } from "@shapediver/viewer";
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

const stringifySessionCommonParameters =  function(parameters: Pick<SessionCreateDto, "excludeViewports" | "id" | "jwtToken" | "modelViewUrl" | "ticket">) {
	return JSON.stringify({
		excludeViewports: parameters.excludeViewports,
		id: parameters.id,
		jwtToken: parameters.jwtToken || "",
		modelViewUrl: parameters.modelViewUrl,
		ticket: parameters.ticket,
	});
};

const middlewareImpl: IMiddlewareMutateImpl = (stateCreator) => (set, get, store) => {
	const parsedSet: typeof set = (...args) => {
		let newState = args[0];

		if (isSetterFunction(newState)) {
			newState = newState(get()) ;
		}

		const parameters: IParameters = {};
		const exports: IExports = {};

		for (const sessionId in newState.activeSessions) {
			if (Object.hasOwnProperty.call(newState.activeSessions, sessionId)) {
				parameters[sessionId] = newState.activeSessions[sessionId]?.parameters || {};
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
		sessionCreate: async ({ id, ticket, modelViewUrl, jwtToken, waitForOutputs, loadOutputs, excludeViewports, initialParameterValues }: SessionCreateDto) => {
			const session = await createSession({
				id: id,
				ticket: ticket,
				modelViewUrl: modelViewUrl,
				jwtToken: jwtToken,
				waitForOutputs: waitForOutputs,
				loadOutputs: loadOutputs,
				excludeViewports: excludeViewports,
				initialParameterValues: initialParameterValues
			});

			return set((state) => {
				return {
					...state,
					activeSessions: {
						...state.activeSessions,
						[id]: session,
					},
				};
			});
		},
		sessionClose: (sessionId) => set((state) => {
			const session = state.activeSessions[sessionId];

			if (session) session.close();

			const activeSessions = state.activeSessions;
			delete activeSessions[sessionId];

			return {
				...state,
				activeSessions,
			};
		}),
		sessionsSync: async (sessionsDto: SessionCreateDto[]) => {
			const { activeSessions, sessionCreate, sessionClose } = get();
			const isSession = (session: ISessionCompare | undefined): session is ISessionCompare => !!session;
			const sessionsExist: ISessionCompare[] = Object.values(activeSessions).map((session) => session
				? { id: session.id, imprint: stringifySessionCommonParameters(session) }
				: undefined).filter(isSession);

			const sessionsDataNew = sessionsDto.map((sessionDto) => ({ id: sessionDto.id, imprint: stringifySessionCommonParameters(sessionDto), data: sessionDto }));

			const sessionsToDelete = sessionsExist.filter((sessionCompareExist) => {
				return sessionsDataNew.findIndex((sessionCompareNew) => sessionCompareNew.imprint === sessionCompareExist.imprint) === -1;
			});

			const sessionsToCreate = sessionsDataNew.filter((sessionCompareNew) => {
				return sessionsExist.findIndex((sessionCompareExist) => sessionCompareExist.imprint === sessionCompareNew.imprint) === -1;
			});

			sessionsToCreate.map((sessionDataNew) => sessionCreate(sessionDataNew.data));

			sessionsToDelete.forEach((sessionToDelete) => sessionClose(sessionToDelete.id));
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
