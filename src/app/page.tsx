"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { usePlayersStore } from '@/store/usePlayersStore';
import { useMatchesStore } from '@/store/useMatchesStore';
import { useStatsStore } from '@/store/useStatsStore';
import { useSeasonsStore } from '@/store/useSeasonsStore';
import { useAppStore } from '@/store/useAppStore';
import { ErrorState } from '@/components/ui/error-state';
import { parseError } from '@/lib/error-utils';

import { SplashScreen } from '@/components/layout/splash-screen';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, Trophy, CalendarPlus,
  TrendingUp, ArrowRight, Star, PlusCircle, Shield,
  Home, Plane
} from "lucide-react";
import { GiWhistle, GiSoccerBall, GiSoccerKick } from "react-icons/gi";
import { format, parseISO, startOfDay } from "date-fns";
import { it } from "date-fns/locale";
import dynamic from "next/dynamic";

const MatchFormDialog = dynamic(() => import("@/components/partite/match-form-dialog").then(mod => mod.MatchFormDialog), {
  ssr: false
});
import { FloatingAssistant } from '@/components/ai/floating-assistant';

export default function HomePage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const { hasInitialized } = useAppStore();
  const [isMatchFormOpen, setIsMatchFormOpen] = useState(false);

  const { activeSeason, error: seasonsError } = useSeasonsStore();
  const { players } = usePlayersStore();
  const { matches, add: addMatch } = useMatchesStore();
  const { playerLeaderboard } = useStatsStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const userName = user?.username || user?.email?.split('@')[0] || "Mister";

  // -- Data Computations --

  // 1. Rosa
  const { totPOR, totDIF, totCEN, totATT } = useMemo(() => {
    return {
      totPOR: players.filter(p => p.role === 'Portiere').length,
      totDIF: players.filter(p => p.role === 'Difensore').length,
      totCEN: players.filter(p => p.role === 'Centrocampista').length,
      totATT: players.filter(p => p.role === 'Attaccante').length,
    };
  }, [players]);

  // 2. Prossima Partita
  const nextMatch = useMemo(() => {
    const today = startOfDay(new Date());
    const upcoming = matches.filter(m => {
      const matchDate = parseISO(m.date);
      return matchDate >= today && m.status !== 'canceled';
    }).sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    return upcoming[0] || null;
  }, [matches]);


  // 4. Wall of Fame (Top Players)
  const topPlayers = useMemo(() => {
    const sortedByGoals = [...playerLeaderboard].sort((a, b) => b.stats.goals - a.stats.goals);
    const sortedByAssists = [...playerLeaderboard].sort((a, b) => b.stats.assists - a.stats.assists);
    const sortedByApps = [...playerLeaderboard].sort((a, b) => b.stats.appearances - a.stats.appearances);

    return {
      bomber: sortedByGoals.length > 0 && sortedByGoals[0].stats.goals > 0 ? sortedByGoals[0] : null,
      assistman: sortedByAssists.length > 0 && sortedByAssists[0].stats.assists > 0 ? sortedByAssists[0] : null,
      fedele: sortedByApps.length > 0 && sortedByApps[0].stats.appearances > 0 ? sortedByApps[0] : null,
    };
  }, [playerLeaderboard]);

  const handleCreateMatch = async (data: any) => {
    await addMatch(data);
  };

  if (!mounted) return null;

  if (seasonsError) {
    return (
      <div className="min-h-screen flex flex-col">
        <PageHeader title="Dashboard" />
        <ErrorState
          error={parseError(seasonsError)}
          onRetry={() => window.location.reload()}
          fullScreen
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      {/* 1. Header */}
      <div className="-mt-2">
        <PageHeader
          title={
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
              <span>Benvenuto, Mister {userName}</span>
              <span className="hidden sm:inline text-muted-foreground/30 font-light">|</span>
              <span className="text-sm sm:text-lg font-bold text-primary dark:text-white uppercase tracking-widest">{activeSeason?.name}</span>
            </div>
          }
          className="mb-2 md:mb-4"
        />
      </div>

      {/* 2. Prossimo Impegno */}
      {nextMatch && (
        <>
          <div className="flex items-center justify-between mt-4 mb-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground dark:text-white">Prossimo Impegno</h3>
          </div>

          <Card
            onClick={() => router.push(`/calendario/${nextMatch.id}?s=${nextMatch.seasonId}`)}
            className="bg-primary/20 dark:bg-brand-orange/10 border-2 border-primary/50 dark:border-brand-orange shadow-xl dark:shadow-[0_0_25px_rgba(172,229,4,0.15)] rounded-3xl cursor-pointer hover:bg-primary/30 dark:hover:bg-brand-orange/20 transition-all overflow-hidden relative group"
          >
            <div className="absolute -right-4 -bottom-4 opacity-5">
              {nextMatch.isHome ? <Home className="w-32 h-32" /> : <Plane className="w-32 h-32" />}
            </div>
            <CardContent className="p-4 sm:p-5">
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex gap-4 items-center">
                  <div className="bg-primary dark:bg-brand-orange text-white dark:text-black p-2.5 sm:p-3 rounded-2xl shadow-lg">
                    <GiWhistle className="h-6 w-6 sm:h-8 sm:w-8" />
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-black uppercase text-primary dark:text-brand-orange tracking-[0.2em] mb-0.5">Partita in Arrivo</p>
                    <h4 className="text-lg sm:text-xl font-black uppercase tracking-tight text-foreground dark:text-white">VS {nextMatch.opponent}</h4>
                    <p className="text-sm font-bold text-muted-foreground dark:text-white/60">
                      {format(parseISO(nextMatch.date), "dd MMMM yyyy", { locale: it })}
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-auto text-right">
                  <div className="inline-block px-3 py-1.5 bg-background/50 dark:bg-black/60 rounded-xl border border-primary/30 dark:border-brand-orange/30 backdrop-blur-md">
                    <p className="text-xs font-black text-foreground dark:text-white uppercase tracking-wider">{nextMatch.isHome ? "Casa" : "Trasferta"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* 3. Azioni Rapide */}
      <h3 className="text-sm font-black uppercase tracking-widest text-foreground dark:text-white mt-5 mb-2">Azioni Rapide</h3>
      <div className="grid grid-cols-3 gap-2">
        <Button
          onClick={() => nextMatch ? router.push(`/calendario/${nextMatch.id}?s=${nextMatch.seasonId}&tab=formazione`) : router.push('/calendario')}
          className="h-auto flex-col items-center justify-center p-3 bg-card dark:bg-white/5 border border-border dark:border-white/10 hover:bg-muted dark:hover:bg-white/10 hover:border-primary dark:hover:border-brand-orange/50 text-foreground dark:text-white rounded-2xl transition-all shadow-sm gap-2"
        >
          <Shield className="h-5 w-5 text-primary dark:text-brand-orange" />
          <span className="text-[10px] font-black uppercase text-center leading-tight">Prossima<br />Formazione</span>
        </Button>

        <Button
          onClick={() => router.push('/statistiche')}
          className="h-auto flex-col items-center justify-center p-3 bg-card dark:bg-white/5 border border-border dark:border-white/10 hover:bg-muted dark:hover:bg-white/10 hover:border-primary dark:hover:border-brand-orange/50 text-foreground dark:text-white rounded-2xl transition-all shadow-sm gap-2"
        >
          <TrendingUp className="h-5 w-5 text-primary dark:text-brand-orange" />
          <span className="text-[10px] font-black uppercase text-center leading-tight">Vedi<br />Statistiche</span>
        </Button>

        <Button
          onClick={() => router.push('/scout?new=true')}
          className="h-auto flex-col items-center justify-center p-3 bg-card dark:bg-white/5 border border-border dark:border-white/10 hover:bg-muted dark:hover:bg-white/10 hover:border-primary dark:hover:border-brand-orange/50 text-foreground dark:text-white rounded-2xl transition-all shadow-sm gap-2"
        >
          <PlusCircle className="h-5 w-5 text-primary dark:text-brand-orange" />
          <span className="text-[10px] font-black uppercase text-center leading-tight">Nuovo<br />Talento</span>
        </Button>
      </div>

      {/* 4. Roster Status */}
      <div
        onClick={() => router.push('/membri')}
        className="flex flex-wrap items-center justify-between p-3 px-4 bg-card dark:bg-black border border-border dark:border-brand-orange/30 rounded-2xl cursor-pointer hover:bg-muted dark:hover:bg-white/5 transition-all shadow-sm group mt-4"
      >
        <div className="flex items-center gap-2 mb-2 sm:mb-0">
          <Users className="h-5 w-5 text-primary dark:text-brand-orange group-hover:scale-110 transition-transform" />
          <span className="text-sm font-black uppercase tracking-tight text-foreground">Rosa: {players.length} Atleti</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex gap-2 sm:gap-3">
            <span className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground/80 dark:text-gray-400">POR: <span className="text-foreground dark:text-white font-black">{totPOR}</span></span>
            <span className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground/80 dark:text-gray-400">DIF: <span className="text-foreground dark:text-white font-black">{totDIF}</span></span>
            <span className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground/80 dark:text-gray-400">CEN: <span className="text-foreground dark:text-white font-black">{totCEN}</span></span>
            <span className="text-[10px] sm:text-xs font-bold uppercase text-muted-foreground/80 dark:text-gray-400">ATT: <span className="text-foreground dark:text-white font-black">{totATT}</span></span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
        </div>
      </div>

      {/* 5. Statistiche Principali (The Wall of Fame) */}
      <div className="flex items-center justify-between mt-4 mb-2">
        <h3 className="text-sm font-black uppercase tracking-widest text-foreground dark:text-white">Statistiche Principali</h3>
        <Button variant="ghost" size="sm" onClick={() => router.push('/statistiche')} className="text-[10px] font-black uppercase text-primary dark:text-brand-orange hover:bg-primary/10 dark:hover:bg-brand-orange/10">
          Vedi Statistiche <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Capocannoniere */}
        <div className="bg-card dark:bg-black border border-border dark:border-yellow-500/30 rounded-2xl p-3 flex gap-3 items-center shadow-sm relative overflow-hidden">
          <div className="bg-yellow-500/10 dark:bg-yellow-500/20 p-2.5 rounded-xl text-yellow-600 dark:text-yellow-400 shrink-0">
            <GiSoccerBall className="h-4 w-4" />
          </div>
          <div className="flex-1 truncate">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground dark:text-white/40">Bomber</p>
            <p className="text-sm font-black uppercase truncate text-foreground dark:text-white">{topPlayers.bomber ? topPlayers.bomber.name : "Nessuno"}</p>
          </div>
          {topPlayers.bomber && (
            <div className="text-right shrink-0">
              <span className="text-lg font-black text-foreground dark:text-yellow-400">{topPlayers.bomber.stats.goals}</span>
            </div>
          )}
        </div>

        {/* Assistman */}
        <div className="bg-card dark:bg-black border border-border dark:border-blue-500/30 rounded-2xl p-3 flex gap-3 items-center shadow-sm relative overflow-hidden">
          <div className="bg-blue-500/10 dark:bg-blue-500/20 p-2.5 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
            <GiSoccerKick className="h-4 w-4" />
          </div>
          <div className="flex-1 truncate">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground dark:text-white/40">Assistman</p>
            <p className="text-sm font-black uppercase truncate text-foreground dark:text-white">{topPlayers.assistman ? topPlayers.assistman.name : "Nessuno"}</p>
          </div>
          {topPlayers.assistman && (
            <div className="text-right shrink-0">
              <span className="text-lg font-black text-foreground dark:text-blue-400">{topPlayers.assistman.stats.assists}</span>
            </div>
          )}
        </div>


      </div>

      <MatchFormDialog
        open={isMatchFormOpen}
        onOpenChange={setIsMatchFormOpen}
        onSave={handleCreateMatch}
      />
      <FloatingAssistant />
    </div>
  );
}
