"use client";

import { create } from 'zustand';
import { matchRepository } from '@/lib/repositories/match-repository';
import type { Match } from '@/lib/types';
import type { MatchCreateData } from '@/lib/repositories/match-repository';
import { useSeasonsStore } from './useSeasonsStore';
import { useAuthStore } from './useAuthStore';
import { getErrorMessage } from '@/lib/error-utils';

interface MatchState {
    matches: Match[];
    loading: boolean;
    error: string | null;
    fetchAll: (seasonId?: string) => Promise<void>;
    add: (data: Omit<MatchCreateData, 'seasonId' | 'userId' | 'teamOwnerId' | 'teamId'>) => Promise<Match | undefined>;
    bulkAdd: (matchesData: Omit<MatchCreateData, 'userId' | 'seasonId' | 'teamOwnerId' | 'teamId'>[]) => Promise<void>;
    update: (id: string, updates: Partial<Omit<Match, 'id' | 'userId'>>) => Promise<void>;
    remove: (id: string) => Promise<void>;
    removeAll: () => Promise<void>;
}

export const useMatchesStore = create<MatchState>((set, get) => ({
    matches: [],
    loading: true,
    error: null,
    fetchAll: async (seasonId) => {
        const user = useAuthStore.getState().user;
        if (!user) return;

        if (get().matches.length === 0) set({ loading: true, error: null });
        const targetSeasonId = seasonId || useSeasonsStore.getState().activeSeason?.id;

        if (!targetSeasonId) {
            set({ matches: [], loading: false, error: null });
            return;
        }

        try {
            const matches = await matchRepository.getAll(user.id, targetSeasonId);
            set({ matches, loading: false, error: null });
        } catch (err) {
            console.error("Error fetching matches:", err);
            set({ loading: false, error: getErrorMessage(err) });
        }
    },
    add: async (data) => {
        const user = useAuthStore.getState().user;
        const activeSeason = useSeasonsStore.getState().activeSeason;
        if (!activeSeason || !user) {
            return undefined;
        }

        const newMatch = await matchRepository.add({
            ...data,
            userId: user.id,
            seasonId: activeSeason.id
        } as MatchCreateData);

        await get().fetchAll(activeSeason.id);
        return newMatch;
    },
    bulkAdd: async (matchesData) => {
        const user = useAuthStore.getState().user;
        const activeSeason = useSeasonsStore.getState().activeSeason;
        if (!activeSeason || !user) return;

        await matchRepository.bulkAdd(matchesData, user.id, activeSeason.id);
        await get().fetchAll(activeSeason.id);
    },
    update: async (id, updates) => {
        const activeSeason = useSeasonsStore.getState().activeSeason;
        if (!activeSeason) return;

        const updatedMatch = await matchRepository.update(id, activeSeason.id, updates);
        if (updatedMatch) {
            await get().fetchAll(activeSeason.id);
        }
    },
    remove: async (id) => {
        const activeSeason = useSeasonsStore.getState().activeSeason;
        if (!activeSeason) return;

        await matchRepository.delete(id, activeSeason.id);
        await get().fetchAll(activeSeason.id);
    },
    removeAll: async () => {
        const user = useAuthStore.getState().user;
        const activeSeason = useSeasonsStore.getState().activeSeason;
        if (!activeSeason || !user) return;

        await matchRepository.deleteAll(user.id, activeSeason.id);
        await get().fetchAll(activeSeason.id);
    },
}));
