"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn, displayPlayerName } from "@/lib/utils";
import { getPositionAcronym, getPositionCoordinates } from "@/lib/lineup-mapping";
import { Plus, User, Activity } from "lucide-react";
import { Player } from "@/lib/types";

interface TacticalPitchEditorProps {
  formation: string;
  starters: string[];
  allPlayers: Player[];
  onSlotClick: (index: number) => void;
  matchDate?: string;
  isEditing?: boolean;
  onSwap?: (source: { type: 'starter' | 'sub', index: number }, target: { type: 'starter' | 'sub', index: number }) => void;
}

export function TacticalPitchEditor({
  formation,
  starters,
  allPlayers,
  onSlotClick,
  matchDate,
  isEditing,
  onSwap,
}: TacticalPitchEditorProps) {
  const isPlayerInjured = (player: Player) => {
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
  };
  return (
    <div className="relative aspect-[3/4] w-full max-w-lg mx-auto rounded-3xl bg-neutral-900 dark:bg-black overflow-hidden border-4 border-white/5 shadow-2xl flex flex-col p-4 select-none">
      {/* Linee del campo */}
      <div className="absolute inset-4 border-2 border-white/10 pointer-events-none rounded-sm">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-16 border-b-2 border-x-2 border-white/10" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-16 border-t-2 border-x-2 border-white/10" />
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/10 rounded-full" />
      </div>

      {/* Giocatori in Campo */}
      <div className="relative w-full h-full">
        {starters.map((playerId, index) => {
          const coords = getPositionCoordinates(formation, index);
          const acronym = getPositionAcronym(formation, index);
          const player = allPlayers.find((p) => p.id === playerId);
          const isPOR = index === 0;

          return (
            <div
              key={index}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 w-16 sm:w-20 transition-all duration-300"
              style={{ top: `${coords.top}%`, left: `${coords.left}%` }}
              onClick={() => onSlotClick(index)}
              data-slot-type="starter"
              data-slot-index={index}
            >
              <motion.div
                data-draggable="true"
                drag={isEditing ? true : false}
                dragSnapToOrigin
                whileDrag={{ scale: 1.3, zIndex: 50 }}
                onDragEnd={(e, info) => {
                  if (!isEditing || !onSwap) return;
                  const el = e.target as HTMLElement;
                  const dragContainer = el.closest('[data-draggable="true"]') as HTMLElement;
                  if (dragContainer) {
                    dragContainer.style.pointerEvents = 'none';
                    dragContainer.style.visibility = 'hidden';
                  }
                  const targetEl = document.elementFromPoint(info.point.x, info.point.y);
                  if (dragContainer) {
                    dragContainer.style.pointerEvents = '';
                    dragContainer.style.visibility = '';
                  }
                  const dropZone = targetEl?.closest('[data-slot-type]');
                  if (dropZone) {
                    const targetType = dropZone.getAttribute('data-slot-type') as 'starter' | 'sub';
                    const targetIndex = parseInt(dropZone.getAttribute('data-slot-index') || '0', 10);
                    onSwap({ type: 'starter', index }, { type: targetType, index: targetIndex });
                  }
                }}
                className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 shadow-lg transition-all cursor-pointer active:scale-90",
                  player
                    ? isPOR
                      ? "bg-amber-600 border-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                      : "bg-primary/90 dark:bg-brand-orange/90 border-primary dark:border-brand-orange text-white dark:text-black shadow-[0_0_15px_rgba(172,229,4,0.3)]"
                    : "bg-neutral-800/50 border-neutral-700 text-neutral-500 border-dashed hover:bg-neutral-800 hover:border-neutral-600"
                )}
              >
                {player ? (
                  <span className="text-[10px] font-black uppercase">{acronym}</span>
                ) : (
                  <Plus className="w-5 h-5" />
                )}
              </motion.div>
              <div className="w-full bg-black/60 backdrop-blur-sm px-1 py-0.5 rounded border border-white/10 text-center overflow-hidden min-h-[1.2rem] flex items-center justify-center gap-1">
                {player && isPlayerInjured(player) && (
                  <Activity className="w-2 h-2 text-red-500 shrink-0" />
                )}
                <p className="text-[8px] sm:text-[9px] font-black text-white uppercase truncate">
                  {player ? displayPlayerName(player) : acronym}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
