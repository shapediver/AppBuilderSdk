import { create } from 'zustand'

interface SessionState {
    selectedSession: {
        ticket: string,
        modelViewUrl: string
    }[];
    setSelectedSessions: (selectedSession: {
        ticket: string,
        modelViewUrl: string
    }[]) => void;
}

export const useTicketSelectStore = create<SessionState>((set) => ({
    selectedSession: [],
    setSelectedSessions: (selectedSession) =>
        set((state) => ({
            ...state,
            selectedSession
        }))
}));