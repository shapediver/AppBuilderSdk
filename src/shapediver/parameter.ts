import { IParameterApi, ISessionApi } from "@shapediver/viewer";
import { ISdReactParameter, ISdReactParameterActions, ISdReactParameterState } from "types/shapediver/parameter";

class SdReactParameter<T> implements ISdReactParameter<T> {

	/** API of the session defining the parameter. */
	private _session: ISessionApi;

	/** The static definition of a parameter. */
	readonly definition: IParameterApi<T>;

	/** The private data for the state prop. */
	private _state: ISdReactParameterState<T>;

	/** Actions that can be taken on the parameter. */
	private _actions: ISdReactParameterActions<T>;

	constructor(session: ISessionApi, parameterId: string) {
		const parameter = session.parameters[parameterId];

		this.definition = parameter;
		this._session = session;
		this._state =  {
			uiValue: parameter.value,
			execValue: parameter.value,
			locked: false
		};
		this._actions = {
			setUiValue: (value: T | string) => {
				if (!this._actions.isValid(value, false)) return false;
		
				this._state = {
					...this.state,
					uiValue: value
				};
		
				this.definition.value = value;
		
				return true;
			},
		
			execute: async () => {
				this.definition.value = this.state.uiValue;
		
				await this._session.customize();
		
				this._state = {
					...this.state,
					execValue: this.state.uiValue,
				};
		
				return true;
			},
		
			isValid: (value: any, throwError?: boolean) => {
				return this.definition.isValid(value, throwError);
			},
		
			resetToDefaultValue: () => {
				this._state = {
					...this.state,
					uiValue: this.definition.defval,
				};
		
				this.definition.resetToDefaultValue();
			},
		
			resetToExecValue: () => {
		
				const value = this.state.execValue;
		
				this._state = {
					...this.state,
					uiValue: value,
				};
		
				this.definition.value = value;
			},
		
			stringify: () => {
				return this.definition.stringify();
			}
		};

	}

	/**
	 * The dynamic properties (aka the "state") of a parameter.
	 * Reactive components can react to this state, but not update it.
	 */
	get state() {
		return this._state;
	}

	get actions() {
		return this._actions;
	}
}

export const createSdReactParameter = <T>(session: ISessionApi, parameterId: string): ISdReactParameter<T>  => {
	return new SdReactParameter(session, parameterId);
};
