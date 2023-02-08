import { addListener, createSession, EVENTTYPE, ISessionApi, ISessionEvent, sessions } from "@shapediver/viewer";
import { useEffect } from "react";

interface Props {
    ticket: string,
    modelViewUrl: string,
    jwtToken?: string,
    id: string,
    waitForOutputs?: boolean,
    loadOutputs?: boolean,
    excludeViewports?: string[],
    initialParameterValues?: { [key: string]: string }
}

export default function SessionComponent(props: Props): JSX.Element {
    let initialized = false;

    useEffect(() => {
        const create = (): Promise<ISessionApi> => {
            initialized = true;
            return createSession({
                id: props.id,
                ticket: props.ticket,
                modelViewUrl: props.modelViewUrl,
                jwtToken: props.jwtToken,
                waitForOutputs: props.waitForOutputs,
                loadOutputs: props.loadOutputs,
                excludeViewports: props.excludeViewports,
                initialParameterValues: props.initialParameterValues
            });
        }

        let sessionPromise: Promise<ISessionApi>;

        if(sessions[props.id] || initialized) {
            // if there is already a session with the same unique id registered
            // we wait until that session is closed until we create this session anew
            // the closing of the session is done on unmount
            // this can happen in development mode due to the duplicate calls of react
            // read about that here: https://reactjs.org/docs/strict-mode.html#ensuring-reusable-state
            sessionPromise = new Promise<ISessionApi>(resolve => {
                addListener(EVENTTYPE.SESSION.SESSION_CLOSED, async (e) => {
                    await new Promise<ISessionApi>(resolve => setTimeout(resolve, 0));
                    const viewportEvent = e as ISessionEvent;
                    if(viewportEvent.sessionId === props.id) {
                        sessionPromise = create();
                        resolve(sessionPromise)
                    }
                })
            })
        } else {
            sessionPromise = create();
        }

        return function cleanup () {
            // unmount 
            sessionPromise.then(s => {
                initialized = false;
                s.close()
            });
        }
    }, [props.id, props.ticket, props.modelViewUrl, props.jwtToken, props.waitForOutputs, props.loadOutputs, props.excludeViewports, props.initialParameterValues]);

    return (<></>);
};
