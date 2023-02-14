import { MultiSelect, Notification } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useModelSelectStore } from "../../context/modelSelectStore";
import SessionComponent from "../shapediver/SessionComponent";

const sessionData: {
    [key: string]: {
        ticket: string,
        modelViewUrl: string
    }
} = {
    "Ring": {
        ticket: "5f26762cb6a8f87eaacd2add011634a8b24c38a3b9d390986f1aac30a6b8aa5ecc1c2ee566b962097c7c94f3b62ea0aed75e0392d6fbfc3ca79f94feb6ceeb28b274c01f840a2bdab73a0f305af24a879829578c1fd703e267329475d9586dfe985e57127c96b4-2d6cf150663a7b480f6501d17e325861",
        modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com"
    },
    "Bench": {
        ticket: "b6b127d7e06588addc43443617c1eeea7ea316bef7ad1273cdd0c82d67f89b8dd4a67a327037b0a3ba2f52377c7d0e1b2a5657dd245603b0a3771d650ea4fbdd76e8187dc21ed1824063e4041b60a28747ed5a51e48c5e77d0c683bee53fb01fa53255e24a74ae-3a01cf3d24f8366dd64a0e2dfce4d4fc",
        modelViewUrl: "https://sdeuc1.eu-central-1.shapediver.com"
    },
    "Outputs Shelf": {
        ticket: "340ff308354b56f5cd0a631f668d48d934a38187c50ff049a19fd3565d316307cb042aaebfdccde871a81f5552c58c04907686e51cada8e8ea7878cfde011ff9d494a54acd68ccf39d9ecfac98bb6a9a2521fc9711294949c1557365b64bbce9e44d420d1b0a64-e5fb4e0ba6c4d6e047685318325f3704",
        modelViewUrl: "https://sdr7euc1.eu-central-1.shapediver.com"
    },
}

/**
 * Function that creates a select element in which models can be selected.
 * For each model select, a session is created.
 * 
 * @returns 
 */
export default function ModelSelect() {
    
    // callback to create the session components
    const RenderSessions = (): JSX.Element => {
        const selectedModels = useModelSelectStore(state => state.selectedModels);

        if (selectedModels.length > 0) {
            // for each selected model, create a SessionComponent
            let elements: JSX.Element[] = [];
            for (let i = 0; i < selectedModels.length; i++) {
                elements.push(<SessionComponent
                    key={'selected_session_' + i + selectedModels[i].ticket}
                    id={'selected_session_' + i}
                    ticket={selectedModels[i].ticket}
                    modelViewUrl={selectedModels[i].modelViewUrl}
                    excludeViewports={["viewport_1"]}
                />);
            }

            return <>{elements}</>;
        } else {
            return <>
                <Notification icon={<IconAlertCircle size={18} />} mt="xs" title="Model Select" disallowClose>
                    Select a model to see it in the viewport!
                </Notification>
            </>;
        }
    }

    // callback for when the value was changed
    const handleChange = (values: string[]) => {
        let selectedModels: {
            ticket: string,
            modelViewUrl: string
        }[] = [];
        for (let i = 0; i < values.length; i++)
            selectedModels.push(sessionData[values[i]]);
        useModelSelectStore.setState({ selectedModels })
    }

    return (
        <>
            <MultiSelect
                data={Object.keys(sessionData)}
                label="Select a ticket"
                placeholder="Pick the models you want to see"
                onChange={handleChange}
            />
            {RenderSessions()}
        </>
    );
}