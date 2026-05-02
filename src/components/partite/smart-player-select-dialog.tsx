"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, User, Check, Star, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Player, Role } from "@/lib/types";
import { displayPlayerName, cn } from "@/lib/utils";
import { getPositionAcronym } from "@/lib/lineup-mapping";

interface SmartPlayerSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (playerId: string) => void;
  allPlayers: Player[];
  selectedPlayerIds: string[];
  formation: string;
  slotIndex: number;
  matchDate?: string;
}

const mapAcronymToRole = (acronym: string): Role => {
  if (acronym === 'POR') return 'Portiere';
  if (['DC'].includes(acronym)) return 'Difensore';
  if (['ATT'].includes(acronym)) return 'Attaccante';
  return 'Centrocampista';
};

export function SmartPlayerSelectDialog({
  open,
  onOpenChange,
  onSelect,
  allPlayers,
  selectedPlayerIds,
  formation,
  slotIndex,
  matchDate,
}: SmartPlayerSelectDialogProps) {
  const [search, setSearch] = React.useState("");
  const acronym = getPositionAcronym(formation, slotIndex);
  const targetRole = mapAcronymToRole(acronym);
  const isInjured = React.useCallback((player: Player) => {
    if (!matchDate || !player.injuries || player.injuries.length === 0) return false;
    const target = new Date(matchDate);
    target.setHours(0, 0, 0, 0);
    return player.injuries.some((inj: any) => {
      const start = new Date(inj.startDate);
      const end = new Date(inj.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return target >= start && target <= end;
    });
  }, [matchDate]);

  const sortedPlayers = React.useMemo(() => {
    // Filter out players already selected in OTHER slots
    // (Wait, the user might want to swap, but usually we filter out)
    const filtered = allPlayers.filter(p => !selectedPlayerIds.includes(p.id) || selectedPlayerIds[slotIndex] === p.id);
    
    const searchLower = search.toLowerCase();
    const searched = filtered.filter(p => 
      p.name.toLowerCase().includes(searchLower) || 
      p.firstName.toLowerCase().includes(searchLower) || 
      p.lastName.toLowerCase().includes(searchLower)
    );

    return searched.sort((a, b) => {
      const getScore = (p: Player) => {
        if (p.role === targetRole) return 100;
        if (p.secondaryRoles?.includes(targetRole)) return 80;
        if (p.role === 'Portiere') return 0; // Goalkeepers last unless target
        return 50; // Others
      };

      const scoreA = getScore(a);
      const scoreB = getScore(b);

      if (scoreA !== scoreB) return scoreB - scoreA;
      return a.name.localeCompare(b.name);
    });
  }, [allPlayers, selectedPlayerIds, slotIndex, search, targetRole]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md h-[80vh] flex flex-col p-0 overflow-hidden border-none bg-background dark:bg-black">
        <DialogHeader className="p-4 border-b border-border dark:border-white/10">
          <DialogTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
            Seleziona {acronym}
            <span className="text-[10px] bg-primary/20 dark:bg-brand-green/20 text-primary dark:text-brand-green px-2 py-0.5 rounded-full font-bold">
              {targetRole}
            </span>
          </DialogTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cerca giocatore..."
              className="pl-10 h-10 bg-muted/50 dark:bg-white/5 border-none focus-visible:ring-1 focus-visible:ring-primary dark:focus-visible:ring-brand-green font-bold uppercase text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-xs font-black uppercase text-muted-foreground hover:bg-muted dark:hover:bg-white/5"
            onClick={() => {
              onSelect("");
              onOpenChange(false);
            }}
          >
            -- Nessuno --
          </Button>
          
          {sortedPlayers.map((player) => {
            const isMatch = player.role === targetRole;
            const isSecondary = player.secondaryRoles?.includes(targetRole);
            const isSelected = selectedPlayerIds[slotIndex] === player.id;
            const injured = isInjured(player);

            return (
              <Button
                key={player.id}
                variant="ghost"
                className={cn(
                  "w-full justify-between h-14 px-3 rounded-xl border border-transparent transition-all",
                  isSelected 
                    ? "bg-primary/10 dark:bg-brand-green/10 border-primary/20 dark:border-brand-green/20" 
                    : injured
                      ? "bg-red-500/5 hover:bg-red-500/10 border-red-500/20"
                      : "hover:bg-muted dark:hover:bg-white/5"
                )}
                onClick={() => {
                  onSelect(player.id);
                  onOpenChange(false);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2",
                    injured
                      ? "bg-red-500/10 border-red-500"
                      : isMatch 
                        ? "bg-primary/20 dark:bg-brand-green/20 border-primary dark:border-brand-green" 
                        : isSecondary
                          ? "bg-amber-500/20 border-amber-500"
                          : "bg-muted dark:bg-white/5 border-border dark:border-white/10"
                  )}>
                    <User className={cn(
                      "w-5 h-5",
                      injured ? "text-red-500" : isMatch ? "text-primary dark:text-brand-green" : isSecondary ? "text-amber-500" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase text-foreground dark:text-white">
                      {displayPlayerName(player)}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      {injured ? "Infortunato" : `${player.role} ${isSecondary ? `• ${targetRole}` : ""}`}
                    </p>
                  </div>
                </div>
                {isSelected ? (
                  <Check className="w-5 h-5 text-primary dark:text-brand-green" />
                ) : (isMatch || isSecondary) ? (
                  <Star className={cn("w-4 h-4", isMatch ? "text-primary dark:text-brand-green fill-primary dark:fill-brand-green" : "text-amber-500")} />
                ) : null}
              </Button>
            );
          })}

          {sortedPlayers.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-xs font-bold uppercase">Nessun giocatore trovato</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
