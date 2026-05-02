"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, ChevronUp, ChevronDown, Sparkles, Search, Plus, ChevronRight, Hospital, Save } from "lucide-react";
import type { Player, Role } from "@/lib/types";
import dynamic from "next/dynamic";

const PlayerFormDialog = dynamic(() => import("@/components/squadra/player-form-dialog").then(mod => mod.PlayerFormDialog), { ssr: false });
const SmartPlayerDialog = dynamic(() => import("@/components/giocatori/smart-player-dialog").then(mod => mod.SmartPlayerDialog), { ssr: false });
const InjuryFormDialog = dynamic(() => import("@/components/squadra/injury-form-dialog").then(mod => mod.InjuryFormDialog), { ssr: false });
import { FaUserSecret } from "react-icons/fa";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePlayersStore } from "@/store/usePlayersStore";
import { useSeasonsStore } from "@/store/useSeasonsStore";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { cn, displayPlayerName } from "@/lib/utils";
import { ErrorState } from "@/components/ui/error-state";
import { parseError, missingSeasonError } from "@/lib/error-utils";

const rolesList: Role[] = ["Portiere", "Difensore", "Centrocampista", "Attaccante"];
const roleColors: Record<Role, string> = {
  "Portiere": "bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-500",
  "Difensore": "bg-slate-100 dark:bg-slate-900/40 border-slate-200 dark:border-slate-500/30 text-slate-700 dark:text-slate-500",
  "Centrocampista": "bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-500",
  "Attaccante": "bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-500",
};

export default function RosaPage() {
  const router = useRouter();
  const { players, loading: playersLoading, error: playersError, fetchAll, add, update, remove, bulkAdd, removeAll } = usePlayersStore();
  const { activeSeason, loading: seasonsLoading, error: seasonsError, fetchAll: fetchSeasons } = useSeasonsStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSmartFormOpen, setIsSmartFormOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isInjuryFormOpen, setIsInjuryFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);

  // Array per tenere traccia delle sezioni aperte (tipo accordion multiplo)
  const [openRoles, setOpenRoles] = useState<string[]>(["Portiere", "Difensore", "Centrocampista", "Attaccante"]);

  const loading = playersLoading || seasonsLoading;

  useEffect(() => {
    const initialize = async () => {
      await fetchSeasons();
      fetchAll();
    };
    initialize();
  }, [fetchAll, fetchSeasons]);

  const toggleRole = (role: string) => {
    setOpenRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleOpenForm = (player: Player | null) => {
    setSelectedPlayer(player);
    setIsFormOpen(true);
  };

  const handleSavePlayer = async (data: { name: string, firstName: string, lastName: string, role: Role, secondaryRoles: Role[] }, playerId?: string) => {
    if (playerId) {
      await update(playerId, data);
    } else {
      await add(data);
    }
  };

  const handleSmartSavePlayers = async (playersData: { name: string, role: Role }[]) => {
    await bulkAdd(playersData);
  };

  const handleDeletePlayer = async () => {
    if (!playerToDelete) return;
    const playerId = playerToDelete.id;
    setPlayerToDelete(null);

    setTimeout(async () => {
      try {
        await remove(playerId);
        // Forza pulizia pointer-events per bug Radix
        document.body.style.pointerEvents = "";
      } catch (error) {
        console.error("Errore durante l'eliminazione del giocatore:", error);
      }
    }, 200);
  };

  const handleDeleteAllPlayers = async () => {
    setIsDeleteAllOpen(false);

    setTimeout(async () => {
      try {
        await removeAll();
        // Forza pulizia pointer-events per bug Radix
        document.body.style.pointerEvents = "";
      } catch (error) {
        console.error("Errore durante l'eliminazione della rosa:", error);
      }
    }, 200);
  };

  const groupedPlayers = useMemo(() => {
    const filtered = players.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups: Record<string, Player[]> = {
      "Portiere": [],
      "Difensore": [],
      "Centrocampista": [],
      "Attaccante": []
    };

    filtered.forEach(p => {
      if (groups[p.role]) {
        groups[p.role].push(p);
      }
    });

    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => (a.lastName || "").localeCompare(b.lastName || ""));
    });

    return groups;
  }, [players, searchTerm]);

  if (!loading && !activeSeason && !seasonsError) {
    return (
      <div className="pb-24 pt-4">
        <ErrorState error={missingSeasonError()} />
      </div>
    );
  }

  const hasPageError = seasonsError || playersError;

  return (
    <div className="pb-24 pt-4 space-y-6">
      {hasPageError ? (
        <ErrorState
          error={parseError(seasonsError || playersError)}
          onRetry={() => {
            fetchSeasons();
            fetchAll();
          }}
        />
      ) : (
        <>
          <div className="px-4">
            <div className="flex gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary dark:text-brand-green" />
                <Input
                  type="text"
                  placeholder="Cerca"
                  className="w-full h-12 pl-12 pr-4 rounded-full bg-background dark:bg-black border border-primary/30 dark:border-brand-green/30 text-foreground placeholder:text-muted-foreground/50 font-medium text-lg focus-visible:ring-1 focus-visible:ring-primary dark:focus-visible:ring-brand-green shadow-sm dark:shadow-[0_0_10px_rgba(172,229,4,0.05)]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {!isEditMode ? (
                  <>
                    <Button
                      onClick={() => router.push('/scout')}
                      variant="ghost"
                      className="h-12 w-12 rounded-full p-0 flex-shrink-0 bg-background dark:bg-black border border-primary/20 dark:border-brand-green/20 text-primary dark:text-brand-green shadow-sm hover:bg-primary/5 dark:hover:bg-brand-green/5 transition-all hover:scale-105 active:scale-95"
                      title="Scout"
                    >
                      <FaUserSecret className="h-6 w-6" />
                    </Button>
                    <Button
                      onClick={() => setIsInjuryFormOpen(true)}
                      variant="ghost"
                      className="h-12 w-12 rounded-full p-0 flex-shrink-0 bg-background dark:bg-black border border-primary/20 dark:border-brand-green/20 text-primary dark:text-brand-green shadow-sm hover:bg-primary/5 dark:hover:bg-brand-green/5 transition-all hover:scale-105 active:scale-95"
                      title="Gestisci Infortuni"
                    >
                      <Hospital className="h-6 w-6" />
                    </Button>
                    <Button
                      onClick={() => handleOpenForm(null)}
                      variant="ghost"
                      className="h-12 w-12 rounded-full p-0 flex-shrink-0 bg-background dark:bg-black border border-primary/20 dark:border-brand-green/20 text-primary dark:text-brand-green shadow-sm hover:bg-primary/5 dark:hover:bg-brand-green/5 transition-all hover:scale-105 active:scale-95"
                      title="Aggiungi Giocatore"
                    >
                      <Plus className="h-7 w-7" />
                    </Button>
                    <Button
                      onClick={() => setIsEditMode(true)}
                      variant="ghost"
                      className="h-12 w-12 rounded-full p-0 flex-shrink-0 bg-background dark:bg-black border border-primary/20 dark:border-brand-green/20 text-primary dark:text-brand-green shadow-sm hover:bg-primary/5 dark:hover:bg-brand-green/5 transition-all hover:scale-105 active:scale-95"
                      title="Modalità Modifica"
                    >
                      <Edit className="h-5 w-5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={() => setIsEditMode(false)}
                      variant="ghost"
                      className="h-12 w-12 rounded-full p-0 flex-shrink-0 bg-primary dark:bg-brand-green border border-primary/20 dark:border-brand-green/20 text-white dark:text-black shadow-sm hover:opacity-90 transition-all hover:scale-105 active:scale-95"
                      title="Salva"
                    >
                      <Save className="h-6 w-6" />
                    </Button>
                    <Button
                      onClick={() => setIsDeleteAllOpen(true)}
                      variant="ghost"
                      className="h-12 w-12 rounded-full p-0 flex-shrink-0 bg-destructive/10 border border-destructive/20 text-destructive shadow-sm hover:bg-destructive/20 transition-all hover:scale-105 active:scale-95"
                      title="Svuota Rosa"
                    >
                      <Trash2 className="h-6 w-6" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 px-3">
            {loading ? (
              <div className="space-y-4 px-2">
                <Skeleton className="h-14 w-full rounded-2xl bg-card/20" />
                <Skeleton className="h-14 w-full rounded-2xl bg-card/20" />
                <Skeleton className="h-14 w-full rounded-2xl bg-card/20" />
              </div>
            ) : (
              rolesList.map(roleKey => {
                const rolePluralMap: Record<string, string> = {
                  "Portiere": "Portieri",
                  "Difensore": "Difensori",
                  "Centrocampista": "Centrocampisti",
                  "Attaccante": "Attaccanti"
                };
                const roleName = rolePluralMap[roleKey];
                const playersInRole = groupedPlayers[roleKey];
                const isOpen = openRoles.includes(roleKey);

                if (playersInRole.length === 0 && searchTerm) return null; // Hide if searching and none found

                return (
                  <div key={roleKey} className="overflow-hidden bg-card dark:bg-black/40 border border-border dark:border-brand-green/20 rounded-2xl shadow-sm dark:shadow-[0_0_10px_rgba(172,229,4,0.05)]">
                    {/* Accordion Header */}
                    <div
                      onClick={() => toggleRole(roleKey)}
                      className={cn(
                        "flex items-center justify-between p-4 cursor-pointer select-none transition-all rounded-t-2xl border-b border-border dark:border-brand-green/20",
                        roleColors[roleKey]
                      )}
                    >
                      <span className="font-medium text-[17px] tracking-wide">{roleName}</span>
                      <div className="bg-background dark:bg-black rounded-xl border border-primary/20 dark:border-brand-green/30 p-1 shadow-sm overflow-hidden transition-all hover:border-primary dark:hover:border-brand-green">
                        {isOpen ? <ChevronUp className="h-5 w-5 text-primary dark:text-brand-green" /> : <ChevronDown className="h-5 w-5 text-primary dark:text-brand-green" />}
                      </div>
                    </div>

                    {/* Accordion Content */}
                    {isOpen && (
                      <div className="flex flex-col py-2 rounded-b-2xl">
                        {playersInRole.length === 0 ? (
                          <div className="py-6 text-center text-muted-foreground text-sm italic">Nessun giocatore in questo ruolo</div>
                        ) : (
                          playersInRole.map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center justify-between p-4 border-b border-border dark:border-brand-green/10 last:border-b-0 group hover:bg-muted dark:hover:bg-black/60 transition-colors cursor-pointer"
                              onClick={() => router.push(`/membri/${player.id}`)}
                            >
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="text-foreground font-medium text-[17px]">{displayPlayerName(player)}</span>
                                  {(() => {
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const isInjured = player.injuries?.some(inj => {
                                      const start = new Date(inj.startDate);
                                      const end = new Date(inj.endDate);
                                      start.setHours(0, 0, 0, 0);
                                      end.setHours(23, 59, 59, 999);
                                      return today >= start && today <= end;
                                    });
                                    return isInjured ? <Hospital className="h-4 w-4 text-rose-500" /> : null;
                                  })()}
                                </div>
                                {player.secondaryRoles && player.secondaryRoles.length > 0 && (
                                  <div className="flex gap-1 mt-0.5">
                                    {player.secondaryRoles.map(r => (
                                      <span key={r} className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground/60 bg-muted-foreground/5 px-1 rounded">
                                        {r.substring(0, 3)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {isEditMode && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground dark:text-white/40 hover:text-destructive hover:bg-destructive/10 dark:hover:text-red-500 dark:hover:bg-red-500/10 transition-all opacity-60 dark:opacity-40"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPlayerToDelete(player);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground dark:text-white/40 hover:text-primary dark:hover:text-brand-green hover:bg-primary/10 dark:hover:bg-brand-green/10 transition-all opacity-60 dark:opacity-40"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenForm(player);
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                              {!isEditMode && <ChevronRight className="h-4 w-4 text-muted-foreground/30" />}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      <PlayerFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSavePlayer}
        player={selectedPlayer}
        onAIImport={() => {
          setIsFormOpen(false);
          setIsSmartFormOpen(true);
        }}
      />

      <SmartPlayerDialog
        open={isSmartFormOpen}
        onOpenChange={setIsSmartFormOpen}
        onSave={handleSmartSavePlayers}
      />



      <AlertDialog open={!!playerToDelete} onOpenChange={(open) => !open && setPlayerToDelete(null)}>
        <AlertDialogContent className="max-w-[90vw] md:max-w-md rounded-3xl bg-card dark:bg-black border border-border dark:border-brand-green/30 text-foreground p-6 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground dark:text-white font-black uppercase text-lg tracking-tight">Rimuovi Giocatore</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed text-muted-foreground">
              Vuoi eliminare definitivamente <strong className="text-foreground dark:text-brand-green">{playerToDelete?.name}</strong> dalla rosa?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-end gap-3 mt-4">
            <AlertDialogCancel className="mt-0 text-[11px] font-bold uppercase rounded-xl flex-1 h-11 border-border dark:border-brand-green/30 text-foreground dark:text-white hover:bg-muted dark:hover:bg-black/40">Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlayer} className="bg-destructive hover:bg-destructive/90 text-[11px] text-destructive-foreground font-bold uppercase rounded-xl flex-1 h-11 border-none shadow-sm dark:shadow-[0_0_15px_rgba(248,113,113,0.3)]">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
        <AlertDialogContent className="max-w-[90vw] md:max-w-md rounded-3xl bg-card dark:bg-black border border-border dark:border-brand-green/30 text-foreground p-6 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive font-black uppercase text-lg tracking-tight">Svuota Rosa</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed text-muted-foreground">
              Vuoi eliminare TUTTI i {players.length} giocatori della rosa? Questa azione è irreversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-end gap-3 mt-4">
            <AlertDialogCancel className="mt-0 text-[11px] font-bold uppercase rounded-xl flex-1 h-11 border-border dark:border-brand-green/30 text-foreground dark:text-white hover:bg-muted dark:hover:bg-black/40">Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllPlayers} className="bg-destructive hover:bg-destructive/90 text-[11px] text-destructive-foreground font-bold uppercase rounded-xl flex-1 h-11 border-none shadow-sm dark:shadow-[0_0_15px_rgba(248,113,113,0.3)]">
              Elimina Tutto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InjuryFormDialog
        open={isInjuryFormOpen}
        onOpenChange={setIsInjuryFormOpen}
      />
    </div>
  );
}
