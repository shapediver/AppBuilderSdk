import { useShapediverStoreViewer } from "store/shapediverStoreViewer";
import { SessionCreateDto } from "types/store/shapediverStoreViewer";
import { useShapediverStoreUI } from "store/shapediverStoreUI";
import { IParameterApi, ISessionApi } from "@shapediver/viewer";
import { ISdReactParameter, ISdReactParameterState } from "types/shapediver/shapediverUi";

class SdReactParameter<T> implements ISdReactParameter<T> {
	/** The session definition. */
	private session: ISessionApi;
	/** The static definition of a parameter. */
	readonly definition: IParameterApi<T>;
	/** The private data for the state prop. */
	private _state: ISdReactParameterState<T>;

	constructor(session: ISessionApi, parameterId: string) {
		const parameter = session.parameters[parameterId];

		this.definition = parameter;
		this.session = session;
		this._state = {
			uiValue: parameter.value,
			execValue: parameter.value,
			locked: false
		};
	}

	/**
	 * The dynamic properties (aka the "state") of a parameter.
	 * Reactive components can react to this state, but not update it.
	 */
	get state() {
		return this._state;
	}

	setUiValue = (value: T | string) => {
		if (!this.isValid(value, false)) return false;

		this._state = {
			...this.state,
			uiValue: value
		};

		return true;
	}

	execute = async () => {
		const value = this.state.uiValue;
		this._state = {
			...this.state,
			execValue: value,
		};

		this.definition.value = value;

		return this.session.customize().then(() => true);
	}

	isValid = (value: any, throwError?: boolean) => {
		return this.definition.isValid(value, throwError);
	}

	resetToDefaultValue = () => {
		this._state = {
			...this.state,
			uiValue: this.definition.defval,
			execValue: this.definition.defval,
		};

		return this.definition.resetToDefaultValue();
	}

	resetToSessionValue = () => {
		this._state = {
			...this.state,
			uiValue: this.definition.sessionValue,
			execValue: this.definition.sessionValue,
		};

		return this.definition.resetToSessionValue();
	}

	stringify() {
		return this.definition.stringify();
	}
}

export const useShapediverUiController = () => {
	const {
		sessionCreate: storeViewerSessionCreate,
		sessionClose: storeViewerSessionClose,
		activeSessionsGet,
	} = useShapediverStoreViewer(state => state);
	const {
		parametersSessionSet,
		parametersSessionGet: storeUiParametersSessionGet,
	} = useShapediverStoreUI(state => state);

	const parametersSessionGet = (sessionId: string) => {
		return storeUiParametersSessionGet(sessionId);
	};

	const parameterSessionParse = <T>(session: ISessionApi, parameterId: string): SdReactParameter<T>  => {
		return new SdReactParameter(session, parameterId);
	};

	const sessionCreate = async (dto: SessionCreateDto) => {
		await storeViewerSessionCreate(dto);

		const parametersParsed: { [parameterId: string]: ISdReactParameter<any> } = {};
		const session = activeSessionsGet()[dto.id];

		if (!session) return false;

		Object.keys(session.parameters || {}).forEach(parameterId => {
			if (!session.parameters[parameterId]) return;

			parametersParsed[parameterId] = parameterSessionParse(session, parameterId);
		});

		parametersSessionSet(dto.id, parametersParsed);

		return true;
	};

	const sessionClose = async (sessionId: string) => {
		const session = activeSessionsGet()[sessionId];

		if (!session) return false;

		await storeViewerSessionClose(sessionId);

		parametersSessionSet(sessionId, undefined);

		return true;
	};

	return {
		parametersSessionGet,
		sessionCreate,
		sessionClose,
	};
};
