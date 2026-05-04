"use client";

import { create } from 'zustand';
import { aggregationRepository } from '@/lib/repositories/aggregation-repository';
import { useSeasonsStore } from './useSeasonsStore';
import { useAuthStore } from './useAuthStore';
import type { AdvancedStatsLeaderboard } from '@/lib/types';
import { getErrorMessage } from '@/lib/error-utils';

interface TeamRecord {
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    matchesPlayed: number;
}

interface PlayerLeaderboardEntry {
    playerId: string;
    name: string;
    firstName?: string;
    lastName?: string;
    stats: {
        appearances: number;
        goals: number;
        assists: number;
        avgMinutes: number;
        yellowCards: number;
        redCards: number;
    };
}

interface TrendEntry {
    date: string;
    opponent: string;
    value: number;
}

interface IntervalEntry {
    name: string;
    value: number;
    fill: string;
}

interface StatsState {
    teamRecord: TeamRecord | null;
    homeRecord: TeamRecord | null;
    awayRecord: TeamRecord | null;
    playerLeaderboard: PlayerLeaderboardEntry[];
    teamTrend: TrendEntry[];
    goalsIntervals: IntervalEntry[];
    advancedLeaderboard: AdvancedStatsLeaderboard | null;
    loading: boolean;
    error: string | null;
    loadSummaryStats: (seasonId?: string) => Promise<void>;
    loadDetailedStats: (seasonId?: string) => Promise<void>;
}

export const useStatsStore = create<StatsState>((set, get) => ({
    teamRecord: null,
    homeRecord: null,
    awayRecord: null,
    playerLeaderboard: [],
    teamTrend: [],
    goalsIntervals: [],
    advancedLeaderboard: null,
    loading: true,
    error: null,
    loadSummaryStats: async (seasonId?: string) => {
        const user = useAuthStore.getState().user;
        const activeSeasonId = seasonId ?? useSeasonsStore.getState().activeSeason?.id;

        if (!user || !activeSeasonId) {
            set({ loading: false });
            return;
        }

        if (get().teamRecord === null) set({ loading: true, error: null });
        
        try {
            // Carica solo i dati necessari per il riepilogo (velocissimo)
            const context = await aggregationRepository.getSummaryContext(user.id, activeSeasonId);
            const records = aggregationRepository.getTeamRecordFromContext(context);
            
            set({ 
                teamRecord: records.overall, 
                homeRecord: records.home,
                awayRecord: records.away,
                loading: false,
                error: null,
            });
        } catch (error) {
            console.error("Errore nel caricamento summary stats:", error);
            set({ loading: false, error: getErrorMessage(error) });
        }
    },
    loadDetailedStats: async (seasonId?: string) => {
        const user = useAuthStore.getState().user;
        const activeSeasonId = seasonId ?? useSeasonsStore.getState().activeSeason?.id;

        if (!user || !activeSeasonId) {
            set({ loading: false });
            return;
        }

        if (get().playerLeaderboard.length === 0) set({ loading: true, error: null });
        
        try {
            // Carica l'intero contesto (più lento, per pagina statistiche)
            const context = await aggregationRepository.getDetailedContext(user.id, activeSeasonId);

            const records = aggregationRepository.getTeamRecordFromContext(context);
            const playerLeaderboard = aggregationRepository.getPlayersAggregatedStatsFromContext(context);
            const teamTrend = aggregationRepository.getTeamTrendFromContext(context);
            const goalsIntervals = aggregationRepository.getGoalsByIntervalFromContext(context);
            
            // Calcola le statistiche avanzate INSIEME alle altre per ottimizzare
            const advancedLeaderboard = aggregationRepository.getAdvancedStatsFromContext(context, activeSeasonId);
            
            const sortedLeaderboard = [...playerLeaderboard].sort((a, b) => {
                if (b.stats.goals !== a.stats.goals) {
                    return b.stats.goals - a.stats.goals;
                }
                if (b.stats.assists !== a.stats.assists) {
                    return b.stats.assists - a.stats.assists;
                }
                return b.stats.appearances - a.stats.appearances;
            });

            set({ 
                teamRecord: records.overall, 
                homeRecord: records.home,
                awayRecord: records.away,
                playerLeaderboard: sortedLeaderboard as PlayerLeaderboardEntry[], 
                teamTrend: teamTrend as TrendEntry[], 
                goalsIntervals,
                advancedLeaderboard,
                loading: false,
                error: null,
            });
        } catch (error) {
            console.error("Errore nel caricamento detailed stats:", error);
            set({ loading: false, error: getErrorMessage(error) });
        }
    },
}));
