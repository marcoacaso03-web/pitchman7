"use client";

import { useState, useMemo, useEffect } from "react";
import { useMatchDetailStore } from "@/store/useMatchDetailStore";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  ClipboardList,
  Sparkles,
  LayoutGrid,
  Users,
  Save,
  RotateCcw,
  Settings2,
  ChevronRight,
  UserCheck,
  AlertCircle,
  Activity,
  Ban
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TacticalPitchEditor } from "./tactical-pitch-editor";
import { SmartPlayerSelectDialog } from "./smart-player-select-dialog";
import { SmartLineupDialog } from "./smart-lineup-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { displayPlayerName, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useSettingsStore } from "@/store/useSettingsStore";

export function MatchLineupTab() {
  const { lineup, allPlayers, saveLineup, loading } = useMatchDetailStore();
  const teamName = useSettingsStore((state) => state.teamName);
  const { match } = useMatchDetailStore();
  const { toast } = useToast();

  const [starters, setStarters] = useState<string[]>(Array(7).fill(""));
  const [substitutes, setSubstitutes] = useState<string[]>(Array(7).fill(""));
  const [modulo, setModulo] = useState("2-3-1");
  const [isSmartOpen, setIsSmartOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Inizializza lo stato locale dal lineup dello store
  useEffect(() => {
    if (lineup) {
      const s = [...Array(7)].map((_, i) => {
        const p = lineup.starters[i];
        return (typeof p === "string" ? p : p?.playerId) || "";
      });
      const subs = [...Array(7)].map((_, i) => {
        const p = lineup.substitutes[i];
        return (typeof p === "string" ? p : p?.playerId) || "";
      });
      setStarters(s);
      setSubstitutes(subs);
      if (lineup.formation) setModulo(lineup.formation);
      setIsDirty(false);
    }
  }, [lineup]);

  const handleSave = async () => {
    try {
      await saveLineup({
        matchId: "", // Gestito dallo store
        starters,
        substitutes,
        formation: modulo,
      });
      setIsDirty(false);
      setIsEditing(false);
      toast({
        title: "Formazione Salvata",
        description: "La formazione è stata aggiornata con successo.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Errore",
        description: "Impossibile salvare la formazione.",
      });
    }
  };

  const handleReset = () => {
    if (lineup) {
      const s = [...Array(7)].map((_, i) => {
        const p = lineup.starters[i];
        return (typeof p === "string" ? p : p?.playerId) || "";
      });
      const subs = [...Array(7)].map((_, i) => {
        const p = lineup.substitutes[i];
        return (typeof p === "string" ? p : p?.playerId) || "";
      });
      setStarters(s);
      setSubstitutes(subs);
      setModulo(lineup.formation || "2-3-1");
    } else {
      setStarters(Array(7).fill(""));
      setSubstitutes(Array(7).fill(""));
      setModulo("2-3-1");
    }
    setIsDirty(false);
    setIsEditing(false);
  };

  const allSelectedIds = useMemo(() => {
    return [...starters, ...substitutes].filter(id => id !== "" && id !== "none");
  }, [starters, substitutes]);

  const isPlayerInjured = (player: any, dateStr: string) => {
    if (!player.injuries || player.injuries.length === 0) return false;
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return player.injuries.some((inj: any) => {
      const start = new Date(inj.startDate);
      const end = new Date(inj.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return target >= start && target <= end;
    });
  };

  const unavailablePlayers = useMemo(() => {
    if (!match?.date) return [];
    return allPlayers.filter(p => isPlayerInjured(p, match.date));
  }, [allPlayers, match?.date]);

  const handlePlayerChange = (idx: number, isStarter: boolean, playerId: string) => {
    if (isStarter) {
      const newStarters = [...starters];
      newStarters[idx] = playerId === "none" ? "" : playerId;
      setStarters(newStarters);
    } else {
      const newSubs = [...substitutes];
      newSubs[idx] = playerId === "none" ? "" : playerId;
      setSubstitutes(newSubs);
    }
    setIsDirty(true);
  };

  if (loading && !lineup) {
    return <div className="py-20 text-center text-muted-foreground animate-pulse font-black uppercase text-xs tracking-widest">Caricamento Formazione...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header / Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="h-10 px-6 bg-primary dark:bg-brand-green text-white dark:text-black rounded-2xl font-black uppercase text-xs shadow-lg dark:shadow-[0_0_15px_rgba(172,229,4,0.2)] hover:scale-105 active:scale-95 transition-all"
            >
              <Settings2 className="mr-2 h-4 w-4" />
              Modifica Formazione
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleReset}
                className="h-10 px-4 rounded-2xl text-muted-foreground font-black uppercase text-[10px] hover:bg-muted dark:hover:bg-white/5 transition-all"
              >
                Annulla
              </Button>
              <Button
                onClick={handleSave}
                className="h-10 px-6 bg-primary dark:bg-brand-green text-white dark:text-black rounded-2xl font-black uppercase text-[10px] shadow-lg dark:shadow-[0_0_15px_rgba(172,229,4,0.2)] animate-in fade-in slide-in-from-left-4"
              >
                <Save className="mr-2 h-4 w-4" />
                Salva
              </Button>
            </div>
          )}
        </div>

        {isEditing && (
          <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 bg-muted/50 dark:bg-black/40 p-1.5 rounded-2xl border border-border dark:border-white/5">
              <span className="text-[9px] font-black uppercase text-muted-foreground ml-2 hidden sm:inline">MODULO</span>
              <Select
                value={modulo}
                onValueChange={(val) => { setModulo(val); setIsDirty(true); }}
              >
                <SelectTrigger className="bg-background dark:bg-black text-primary dark:text-brand-green h-9 text-xs w-28 font-black border-none shadow-none uppercase focus:ring-0 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card dark:bg-black border-border dark:border-brand-green/50 text-foreground dark:text-white rounded-xl">
                  {["2-3-1", "3-2-1", "2-2-2", "3-1-2", "1-3-2"].map(f => (
                    <SelectItem key={f} value={f} className="text-xs font-black uppercase">{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={() => setIsSmartOpen(true)}
              className="h-10 px-4 rounded-2xl border-primary/30 dark:border-brand-green/30 text-primary dark:text-brand-green font-black uppercase text-[10px] hover:bg-primary/5 dark:hover:bg-brand-green/5 transition-all"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI Smart Mode
            </Button>
          </div>
        )}
      </div>
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Campo Area */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <LayoutGrid className="w-4 h-4 text-primary dark:text-brand-green" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Titolari in Campo</h4>
          </div>
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <TacticalPitchEditor
              formation={modulo}
              starters={starters}
              allPlayers={allPlayers}
              matchDate={match?.date}
              onSlotClick={(idx) => isEditing && setEditingSlot(idx)}
            />
          </div>
        </div>

        {/* Panchina Area */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Users className="w-4 h-4 text-primary dark:text-brand-green" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Panchina ({substitutes.filter(s => s).length})</h4>
          </div>
          <Card className="bg-card dark:bg-black/40 border-border dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
            {!isEditing && substitutes.filter(s => s).length === 0 ? (
              <div className="p-8 text-center text-[10px] font-black uppercase text-muted-foreground/50 tracking-widest">
                Nessun giocatore in panchina
              </div>
            ) : (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {substitutes.map((s, i) => {
                  if (!isEditing && !s) return null;

                  const player = allPlayers.find(p => p.id === s);
                  const availablePlayers = allPlayers.filter(p => !allSelectedIds.includes(p.id) || p.id === s);

                  return (
                    <div key={i} className="flex items-center gap-3 p-2 bg-muted/30 dark:bg-white/5 rounded-xl border border-transparent hover:border-primary/20 dark:hover:border-brand-green/20 transition-all">
                      <div className="w-7 h-7 rounded-full bg-background dark:bg-black flex items-center justify-center text-[9px] font-black text-muted-foreground border border-border dark:border-white/10 shrink-0">
                        R{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Select
                          value={s || "none"}
                          onValueChange={(val) => handlePlayerChange(i, false, val)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger className={cn(
                            "border-none shadow-none h-7 p-0 bg-transparent focus:ring-0 text-[11px] font-black uppercase flex items-center gap-2",
                            isEditing ? "text-foreground dark:text-white" : "text-muted-foreground cursor-default"
                          )}>
                            {player && isPlayerInjured(player, match?.date || "") && (
                              <Activity className="w-3 h-3 text-red-500 shrink-0" />
                            )}
                            <SelectValue placeholder="-- SELEZIONA --" />
                          </SelectTrigger>
                          <SelectContent className="bg-card dark:bg-black border-border dark:border-brand-green/50">
                            <SelectItem value="none" className="text-[10px] font-bold uppercase text-muted-foreground">-- Nessuno --</SelectItem>
                            {availablePlayers.map(p => (
                              <SelectItem key={p.id} value={p.id} className="text-[11px] font-black uppercase">{displayPlayerName(p)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Indisponibili Area */}
        {unavailablePlayers.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500">Giocatori Indisponibili</h4>
            </div>
            <Card className="bg-card dark:bg-black/40 border-border dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {unavailablePlayers.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/20 dark:bg-white/5 border border-transparent">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                      <span className="text-[10px] font-black uppercase truncate text-foreground dark:text-white/80">
                        {displayPlayerName(p)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Activity className="w-3 h-3 text-red-500/70" />
                      <span className="text-[8px] font-black uppercase text-muted-foreground">Infortunio</span>
                    </div>
                  </div>
                ))}
              </CardContent>
              <div className="px-4 py-2 bg-muted/10 dark:bg-black/40 border-t border-border dark:border-white/5">
                <p className="text-[8px] font-bold text-muted-foreground/40 uppercase text-center italic">
                  La logica delle squalifiche sarà aggiunta prossimamente
                </p>
              </div>
            </Card>
          </div>
        )}
      </div>

      {editingSlot !== null && (
        <SmartPlayerSelectDialog
          open={editingSlot !== null}
          onOpenChange={(open) => !open && setEditingSlot(null)}
          slotIndex={editingSlot}
          formation={modulo}
          allPlayers={allPlayers}
          selectedPlayerIds={[...starters, ...substitutes]}
          matchDate={match?.date}
          onSelect={(playerId) => handlePlayerChange(editingSlot, true, playerId)}
        />
      )}

      <SmartLineupDialog
        open={isSmartOpen}
        onOpenChange={setIsSmartOpen}
      />
    </div>
  );
}
