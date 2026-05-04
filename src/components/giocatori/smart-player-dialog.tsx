"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, AlertCircle, Info } from 'lucide-react';
import * as AIService from '@/services/ai.service';
import { useToast } from '@/hooks/use-toast';
import { Role } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface SmartPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (players: { name: string, role: Role }[]) => Promise<void>;
}

export function SmartPlayerDialog({ open, onOpenChange, onSave }: SmartPlayerDialogProps) {
  const [rawText, setRawText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleSmartImport = async () => {
    if (!rawText.trim() || rawText.trim().length < 5) return;

    setIsAnalyzing(true);
    try {
      const result = await AIService.importPlayers({ rawText: rawText.trim() });
      
      if (result.players.length === 0) {
        throw new Error("Nessun giocatore individuato. Controlla il formato del testo.");
      }

      await onSave(result.players as { name: string, role: Role }[]);

      toast({
        title: "Rosa Aggiornata",
        description: `Importati con successo ${result.players.length} giocatori.`,
      });
      onOpenChange(false);
      setRawText('');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Errore Importazione Smart",
        description: error.message,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-xl rounded-[32px] p-0 overflow-hidden border border-border dark:border-brand-orange/30 shadow-2xl flex flex-col max-h-[90vh] bg-card dark:bg-black">
        <DialogHeader className="p-8 bg-card dark:bg-black text-foreground dark:text-white shrink-0 shadow-sm border-b border-border dark:border-brand-orange/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-muted dark:bg-brand-orange/10 rounded-2xl shadow-sm dark:shadow-[0_0_15px_rgba(172,229,4,0.1)]">
              <Sparkles className="h-7 w-7 text-primary dark:text-brand-orange" />
            </div>
            <div>
              <DialogTitle className="uppercase font-black text-2xl tracking-tighter text-white dark:text-white">Smart Rosa Import</DialogTitle>
              <DialogDescription className="text-muted-foreground dark:text-brand-orange/60 text-[10px] font-black uppercase tracking-[0.3em] mt-1">
                Potenziato da Intelligenza Artificiale
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 bg-background dark:bg-black transition-colors">
          <div className="p-8 space-y-8">
            <Alert className="bg-muted dark:bg-black/40 border-primary/20 dark:border-brand-orange/20 rounded-[24px] p-5 shadow-sm dark:shadow-[0_0_15px_rgba(172,229,4,0.05)] transition-all">
              <Info className="h-5 w-5 text-primary dark:text-brand-orange" />
              <div className="ml-2">
                <AlertTitle className="text-[11px] font-black uppercase text-foreground dark:text-white tracking-widest mb-1.5 flex items-center gap-2">
                  Guida Rapida
                </AlertTitle>
                <AlertDescription className="text-[11px] font-bold text-muted-foreground dark:text-white/40 uppercase leading-relaxed tracking-wide">
                  Copia e incolla la lista dei giocatori. Puoi specificare i ruoli come intestazioni. 
                  <span className="text-foreground dark:text-white block mt-2 p-3 bg-background/50 dark:bg-black rounded-xl border border-border dark:border-brand-orange/10">
                    Esempio: "Difensori: Rossi, Bianchi. Centrocampisti: Verdi..."
                  </span>
                  <span className="text-foreground dark:text-brand-orange/80 block mt-3 font-black">L'AI riconoscerà automaticamente nomi e ruoli tecnici.</span>
                </AlertDescription>
              </div>
            </Alert>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] ml-1">Input Testuale</p>
                {rawText.length > 0 && <span className="text-[9px] font-black text-primary dark:text-brand-orange uppercase">{rawText.length} Caratteri</span>}
              </div>
              <Textarea
                placeholder="Incolla qui la lista...&#10;Es: Portieri: Buffon; Difensori: Chiellini..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                disabled={isAnalyzing}
                className="min-h-[280px] text-xs font-black uppercase rounded-[24px] bg-muted/30 dark:bg-black border-border dark:border-brand-orange/20 focus-visible:ring-1 focus-visible:ring-primary dark:focus-visible:ring-brand-orange focus-visible:border-primary dark:focus-visible:border-brand-orange transition-all p-5 placeholder:text-muted-foreground/30"
              />
            </div>

            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center p-10 bg-muted/20 dark:bg-brand-orange/5 rounded-[28px] border border-dashed border-primary/20 dark:border-brand-orange/30 space-y-4 animate-in fade-in zoom-in duration-500">
                <Loader2 className="h-12 w-12 text-primary dark:text-brand-orange animate-spin" />
                <div className="text-center space-y-1">
                  <p className="text-[11px] font-black uppercase text-primary dark:text-brand-orange animate-pulse tracking-[0.3em]">Analisi AI in Corso...</p>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Organizzazione rosa e categorizzazione ruoli</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-8 pt-0 flex-row gap-4 shrink-0 bg-background dark:bg-black transition-colors">
          <Button 
            variant="ghost" 
            className="flex-1 rounded-2xl font-black uppercase text-[10px] tracking-widest h-14 text-muted-foreground hover:bg-muted dark:hover:bg-white/5 transition-all" 
            onClick={() => onOpenChange(false)} 
            disabled={isAnalyzing}
          >
            Annulla
          </Button>
          <Button 
            onClick={handleSmartImport} 
            className="flex-1 bg-primary dark:bg-black border-2 border-primary dark:border-brand-orange text-white dark:text-brand-orange hover:opacity-90 dark:hover:bg-black/80 rounded-2xl font-black uppercase text-[10px] tracking-widest h-14 shadow-lg dark:shadow-[0_0_15px_rgba(172,229,4,0.2)] hover:scale-[1.02] active:scale-95 transition-all" 
            disabled={isAnalyzing || !rawText.trim()}
          >
            {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Importa Giocatori"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
