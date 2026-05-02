
"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { matchRepository } from '@/lib/repositories/match-repository';
import { playerRepository } from '@/lib/repositories/player-repository';
import { aggregationRepository } from '@/lib/repositories/aggregation-repository';
import { lineupRepository } from '@/lib/repositories/lineup-repository';
import { eventRepository } from '@/lib/repositories/event-repository';
import { statsRepository } from '@/lib/repositories/stats-repository';
import { useStatsStore } from './useStatsStore';
import { useSeasonsStore } from './useSeasonsStore';
import { useAuthStore } from './useAuthStore';
import type { Match, Player, MatchLineup, MatchEvent, PlayerMatchStats } from '@/lib/types';
import { countGoals } from '@/lib/goal-utils';

interface MatchDetailState {
    matchId: string | null;
    match: Match | null;
    allPlayers: Player[];
    events: MatchEvent[];
    lineup: MatchLineup | null;
    stats: PlayerMatchStats[];
    loading: boolean;
    error: string | null;
    
    load: (matchId: string, seasonId?: string) => Promise<void>;
    updateMatch: (data: Partial<Omit<Match, 'id'>>) => Promise<void>;
    saveLineup: (lineup: MatchLineup) => Promise<void>;
    saveAllStats: (stats: PlayerMatchStats[]) => Promise<void>;
    addEvent: (event: Omit<MatchEvent, 'id'>) => Promise<void>;
    addEvents: (events: Omit<MatchEvent, 'id'>[]) => Promise<void>;
    updateEvent: (eventId: string, data: Partial<Omit<MatchEvent, 'id' | 'matchId'>>) => Promise<void>;
    deleteEvent: (eventId: string) => Promise<void>;
    syncAndPersistMinutes: () => Promise<void>;
}

const periodOrder: Record<string, number> = { '1T': 1, '2T': 2, '1TS': 3, '2TS': 4 };

export const useMatchDetailStore = create<MatchDetailState>()(
  persist(
    (set, get) => ({
    matchId: null,
    match: null,
    allPlayers: [],
    events: [],
    lineup: null,
    stats: [],
    loading: true,
    error: null,

    load: async (matchId, seasonId) => {
        set(state => ({ 
            loading: !state.match || state.matchId !== matchId, 
            error: null, 
            matchId, 
            match: state.matchId === matchId ? state.match : null 
        }));
        
        try {
            const authState = useAuthStore.getState();
            if (!authState.isAuthenticated || !authState.user) {
                set({ error: "Accesso negato: devi essere loggato per visualizzare i dettagli.", loading: false });
                return;
            }
            
            const currentUser = authState.user;
            let targetSeasonId = seasonId || useSeasonsStore.getState().activeSeason?.id;
            
            if (!targetSeasonId) {
                await useSeasonsStore.getState().fetchAll();
                targetSeasonId = useSeasonsStore.getState().activeSeason?.id;
            }

            if (!targetSeasonId) {
                set({ error: "Identificativo stagione mancante.", loading: false });
                return;
            }

            const match = await matchRepository.getById(matchId, targetSeasonId);
            
            if (!match) {
                set({ error: "Partita non trovata o permessi insufficienti.", loading: false });
                return;
            }

            const [allPlayers, matchEvents, matchLineup, matchStats] = await Promise.all([
                playerRepository.getAll(currentUser.id, targetSeasonId),
                eventRepository.getForMatch(matchId, targetSeasonId, currentUser.id),
                lineupRepository.getForMatch(matchId, targetSeasonId, currentUser.id),
                statsRepository.getForMatch(matchId, targetSeasonId, currentUser.id)
            ]);

            set({ 
                match, 
                allPlayers,
                events: matchEvents || [],
                lineup: matchLineup || null,
                stats: matchStats || [],
                loading: false,
                error: null
            });
        } catch (e: any) {
            console.error("Match load error:", e);
            set({ 
                error: e.message || "Errore durante il recupero dei dati.", 
                loading: false 
            });
        }
    },

    syncAndPersistMinutes: async () => {
        const { match, lineup, events, matchId, allPlayers } = get();
        const user = useAuthStore.getState().user;
        if (!match || !matchId || !user) return;

        const duration = match.duration || 60;
        const halfTime = Math.floor(duration / 2);
        const pitchManTeam = match.isHome ? 'home' : 'away';

        const getAbsoluteMinute = (event: MatchEvent) => {
            const min = event.minute ?? 0;
            if (event.period === '1T') return Math.min(min, halfTime);
            if (event.period === '2T') return halfTime + Math.min(min, halfTime);
            return min + duration; 
        };

        const chronologicalEvents = [...events].sort((a, b) => {
            const pA = periodOrder[a.period] || 0;
            const pB = periodOrder[b.period] || 0;
            if (pA !== pB) return pA - pB;
            return (a.minute ?? 0) - (b.minute ?? 0);
        });

        const newStats: PlayerMatchStats[] = allPlayers.map(player => {
            const playerId = player.id;
            const teamEvents = events.filter(e => e.team === pitchManTeam);
            
            const yellowCards = teamEvents.filter(e => e.type === 'yellow_card' && e.playerId === playerId).length;
            const redCards = teamEvents.filter(e => e.type === 'red_card' && e.playerId === playerId).length;
            const goals = teamEvents.filter(e => e.type === 'goal' && e.playerId === playerId).length;
            const assists = teamEvents.filter(e => e.type === 'goal' && e.assistPlayerId === playerId).length;
            // Nota: own_goal NON viene conteggiato come gol del giocatore

            let minutesPlayed = 0;
            const isStarter = lineup?.starters.some(p => (typeof p === 'string' ? p : p.playerId) === playerId);
            const isSubstitute = lineup?.substitutes.some(p => (typeof p === 'string' ? p : p.playerId) === playerId);

            if (lineup && (isStarter || isSubstitute)) {
                if (isStarter) {
                    const subOutEvent = chronologicalEvents.find(e => 
                        e.type === 'substitution' && e.subOutPlayerId === playerId && e.team === pitchManTeam
                    );
                    minutesPlayed = subOutEvent ? getAbsoluteMinute(subOutEvent) : duration;
                } else {
                    const subInEvent = chronologicalEvents.find(e => 
                        e.type === 'substitution' && e.playerId === playerId && e.team === pitchManTeam
                    );
                    if (subInEvent) {
                        const subInMin = getAbsoluteMinute(subInEvent);
                        const subOutEventLater = chronologicalEvents.find(e => 
                            e.type === 'substitution' && e.subOutPlayerId === playerId && e.team === pitchManTeam && getAbsoluteMinute(e) > subInMin
                        );
                        const endMin = subOutEventLater ? getAbsoluteMinute(subOutEventLater) : duration;
                        minutesPlayed = Math.max(0, endMin - subInMin);
                    }
                }
            }

            return { matchId, playerId, minutesPlayed, goals, assists, yellowCards, redCards, teamOwnerId: user.id };
        }).filter(s => s.minutesPlayed > 0 || s.goals > 0 || s.assists > 0 || s.yellowCards > 0 || s.redCards > 0);

        set({ stats: newStats });

        // Scritture asincrone
        newStats.forEach(stat => {
            statsRepository.upsert(matchId, match.seasonId, stat.playerId, stat, user.id);
        });

        aggregationRepository.syncAllPlayersStats(user.id, match.seasonId).then(() => {
            useStatsStore.getState().loadSummaryStats();
        });
    },

    saveAllStats: async (newStats) => {
        const { matchId, match } = get();
        const user = useAuthStore.getState().user;
        if (!matchId || !match || !user) return;
        
        set({ stats: newStats });
        
        newStats.forEach(stat => {
            statsRepository.upsert(matchId, match.seasonId, stat.playerId, stat, user.id);
        });

        aggregationRepository.syncAllPlayersStats(user.id, match.seasonId).then(() => {
            useStatsStore.getState().loadSummaryStats();
        });
    },

    addEvent: async (eventData) => {
        const { matchId, match, events: currentEvents } = get();
        const user = useAuthStore.getState().user;
        if (!matchId || !match || !user) return;

        const tempId = `temp-${Date.now()}`;
        const newEvent: MatchEvent = { ...eventData, id: tempId, matchId };
        const updatedEvents = [...currentEvents, newEvent].sort((a, b) => {
            const pA = periodOrder[a.period] || 0;
            const pB = periodOrder[b.period] || 0;
            if (pA !== pB) return pA - pB;
            return (a.minute ?? 0) - (b.minute ?? 0);
        });

        const { home: homeGoals, away: awayGoals } = countGoals(updatedEvents);
        const updatedMatch = { ...match, result: { home: homeGoals, away: awayGoals } };

        set({ events: updatedEvents, match: updatedMatch });

        eventRepository.add({ ...eventData, matchId }, match.seasonId, user.id).then((savedEvent) => {
            set(state => ({
                events: state.events.map(e => e.id === tempId ? savedEvent : e)
            }));
        });
        
        matchRepository.update(matchId, match.seasonId, { result: { home: homeGoals, away: awayGoals } });
        get().syncAndPersistMinutes();
    },

    addEvents: async (eventsData) => {
        const { matchId, match, events: currentEvents } = get();
        const user = useAuthStore.getState().user;
        if (!matchId || !match || !user) return;

        let updatedEvents = [...currentEvents];
        const tempMappings: Record<string, string> = {};

        for (const data of eventsData) {
            const tempId = `temp-${Math.random()}`;
            updatedEvents.push({ ...data, id: tempId, matchId });
            
            eventRepository.add({ ...data, matchId }, match.seasonId, user.id).then(saved => {
              set(state => ({
                events: state.events.map(e => e.id === tempId ? saved : e)
              }));
            });
        }

        updatedEvents.sort((a, b) => {
            const pA = periodOrder[a.period] || 0;
            const pB = periodOrder[b.period] || 0;
            if (pA !== pB) return pA - pB;
            return (a.minute ?? 0) - (b.minute ?? 0);
        });

        const { home: homeGoals, away: awayGoals } = countGoals(updatedEvents);
        const updatedMatch = { ...match, result: { home: homeGoals, away: awayGoals } };

        set({ events: updatedEvents, match: updatedMatch });

        matchRepository.update(matchId, match.seasonId, { result: { home: homeGoals, away: awayGoals } });
        get().syncAndPersistMinutes();
    },

    updateEvent: async (eventId, eventData) => {
        const { matchId, match, events: currentEvents } = get();
        const user = useAuthStore.getState().user;
        if (!matchId || !match || !user) return;

        const updatedEvents = currentEvents.map(e => 
          e.id === eventId ? { ...e, ...eventData } : e
        ).sort((a, b) => {
            const pA = periodOrder[a.period] || 0;
            const pB = periodOrder[b.period] || 0;
            if (pA !== pB) return pA - pB;
            return (a.minute ?? 0) - (b.minute ?? 0);
        });

        const { home: homeGoals, away: awayGoals } = countGoals(updatedEvents);
        const updatedMatch = { ...match, result: { home: homeGoals, away: awayGoals } };

        set({ events: updatedEvents, match: updatedMatch });

        eventRepository.update(eventId, matchId, match.seasonId, eventData);
        matchRepository.update(matchId, match.seasonId, { result: { home: homeGoals, away: awayGoals } });
        get().syncAndPersistMinutes();
    },

    deleteEvent: async (eventId) => {
        const { matchId, match, events: currentEvents } = get();
        const user = useAuthStore.getState().user;
        if (!matchId || !match || !user) return;

        const updatedEvents = currentEvents.filter(e => e.id !== eventId);
        const { home: homeGoals, away: awayGoals } = countGoals(updatedEvents);
        const updatedMatch = { ...match, result: { home: homeGoals, away: awayGoals } };

        set({ events: updatedEvents, match: updatedMatch });

        eventRepository.delete(eventId, matchId, match.seasonId);
        matchRepository.update(matchId, match.seasonId, { result: { home: homeGoals, away: awayGoals } });
        
        get().syncAndPersistMinutes();
    },
    
    updateMatch: async (data) => {
        const { matchId, match } = get();
        if (!matchId || !match) return;

        let updates: Partial<Match> = { ...data };
        // Se la partita viene segnata come completata ma non c'è un risultato, lo inizializziamo a 0-0
        if (updates.status === 'completed' && !match.result && !updates.result) {
            updates.result = { home: 0, away: 0 };
        }

        const updatedMatch = { ...match, ...updates };
        set({ match: updatedMatch });

        matchRepository.update(matchId, match.seasonId, updates);
        
        if (updates.duration || updates.status === 'completed') {
            get().syncAndPersistMinutes();
        }
    },

    saveLineup: async (lineupData) => {
        const { matchId, match } = get();
        const user = useAuthStore.getState().user;
        if (!matchId || !match || !user) return;

        set({ lineup: { ...lineupData, matchId } });

        lineupRepository.save({ ...lineupData, matchId }, match.seasonId, user.id);
        get().syncAndPersistMinutes();
    }
  }),
  {
    name: 'pitchman-match-detail',
  }
 )
);
