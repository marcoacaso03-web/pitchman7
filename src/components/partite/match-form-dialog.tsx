
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Match, MATCH_TYPES, TOURNAMENT_PHASES, TournamentPhase } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSettingsStore } from "@/store/useSettingsStore";

import { Loader2 } from "lucide-react";

const safeParseDate = (dateSource?: any): Date => {
  if (!dateSource) return new Date();
  if (typeof dateSource === 'string') return new Date(dateSource);
  if (dateSource instanceof Date) return dateSource;
  if (dateSource && typeof dateSource.toDate === 'function') return dateSource.toDate();
  const d = new Date(dateSource);
  return isNaN(d.getTime()) ? new Date() : d;
};

const toDateInputValue = (dateSource?: any): string => {
  const date = safeParseDate(dateSource);
  return date.toISOString().split('T')[0];
};

const formSchema = z.object({
  opponent: z.string().min(2, { message: "Il nome dell'avversario è richiesto." }),
  date: z.string().min(1, { message: "La data è richiesta." }),
  isHome: z.boolean(),
  type: z.enum(MATCH_TYPES),
  duration: z.coerce.number().int().min(1, "Durata richiesta"),
  status: z.enum(['scheduled', 'completed', 'canceled']),
  round: z.coerce.number().int().optional().or(z.literal(0)),
  tournamentName: z.string().optional(),
  tournamentPhase: z.enum(TOURNAMENT_PHASES).optional(),
});

type MatchFormValues = z.infer<typeof formSchema>;

interface MatchFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any, matchId?: string) => Promise<void> | void;
  match?: Match | null;
}

export function MatchFormDialog({ open, onOpenChange, onSave, match }: MatchFormDialogProps) {
  const { defaultDuration } = useSettingsStore();
  const [isSaving, setIsSaving] = React.useState(false);
  
  const form = useForm<MatchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      opponent: "",
      date: "",
      isHome: true,
      type: 'Torneo',
      duration: defaultDuration,
      status: 'completed',
      round: 0,
      tournamentName: "",
      tournamentPhase: undefined,
    },
  });

  React.useEffect(() => {
    if (open) {
      const initialDate = match ? toDateInputValue(match.date) : toDateInputValue(new Date());
      form.reset({
        opponent: match?.opponent || "",
        date: initialDate,
        isHome: match?.isHome ?? true,
        type: match?.type || 'Torneo',
        duration: match?.duration || defaultDuration,
        status: match?.status || 'completed',
        round: match?.round || 0,
        tournamentName: match?.tournamentName || "",
        tournamentPhase: match?.tournamentPhase || undefined,
      });
    }
  }, [open, match, form, defaultDuration]);


  async function onSubmit(data: MatchFormValues) {
    setIsSaving(true);
    try {
      await onSave({
          ...data,
          date: new Date(data.date).toISOString(), // Salviamo come stringa ISO a mezzanotte
      }, match?.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
    } finally {
      setIsSaving(false);
    }
  }

  const { min, max } = React.useMemo(() => {
    const now = new Date();
    const twoYearsAgo = new Date(now);
    twoYearsAgo.setFullYear(now.getFullYear() - 2);
    const twoYearsLater = new Date(now);
    twoYearsLater.setFullYear(now.getFullYear() + 2);
    return {
      min: toDateInputValue(twoYearsAgo),
      max: toDateInputValue(twoYearsLater),
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
              <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto rounded-3xl bg-card dark:bg-background border border-primary/30 dark:border-brand-orange/30 shadow-[0_0_25px_rgba(172,229,4,0.15)]">
        <DialogHeader>
          <DialogTitle className="font-black uppercase text-foreground">
            {match ? "Modifica Gara" : "Nuova Gara"}
          </DialogTitle>
          <DialogDescription className="text-xs uppercase font-bold text-muted-foreground/60">
            {match
              ? "Aggiorna le informazioni della partita."
              : "Inserisci i dettagli per pianificare la gara."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="opponent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-brand-orange">Avversario</FormLabel>
                  <FormControl>
                    <Input placeholder="Es: Real Isola" {...field} className="h-11 rounded-xl font-bold uppercase text-xs bg-background dark:bg-black border border-primary/50 dark:border-brand-orange/50 focus-visible:ring-1 focus-visible:ring-primary dark:focus-visible:ring-brand-orange text-foreground dark:text-white" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4">
                <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-brand-orange">Tipo Gara</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger className="h-11 rounded-xl text-xs font-bold uppercase bg-background dark:bg-black border border-primary/50 dark:border-brand-orange/50 focus:ring-1 focus:ring-primary dark:focus:ring-brand-orange text-foreground dark:text-white">
                                <SelectValue placeholder="Tipo" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border border-primary/30 dark:border-brand-orange/30 text-foreground">
                            {MATCH_TYPES.map(t => (
                              <SelectItem key={t} value={t} className="text-xs font-bold uppercase">{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
              />

              {form.watch("type") === "Torneo" && (
                <>
                  <FormField
                    control={form.control}
                    name="tournamentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-brand-orange">Nome Torneo</FormLabel>
                        <FormControl>
                          <Input placeholder="Es: Torneo Estivo" {...field} className="h-11 rounded-xl font-bold uppercase text-xs bg-background dark:bg-black border border-primary/50 dark:border-brand-orange/50 focus-visible:ring-1 focus-visible:ring-primary dark:focus-visible:ring-brand-orange text-foreground dark:text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tournamentPhase"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-brand-orange">Fase Torneo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl text-xs font-bold uppercase bg-background dark:bg-black border border-primary/50 dark:border-brand-orange/50 focus:ring-1 focus:ring-primary dark:focus:ring-brand-orange text-foreground dark:text-white">
                              <SelectValue placeholder="Seleziona fase..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border border-primary/30 dark:border-brand-orange/30 text-foreground">
                            {TOURNAMENT_PHASES.map(phase => (
                              <SelectItem key={phase} value={phase} className="text-xs font-bold uppercase">{phase}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-brand-orange">Durata (Min)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value.toString()}>
                        <FormControl>
                            <SelectTrigger className="h-11 rounded-xl text-xs font-bold uppercase bg-background dark:bg-black border border-primary/50 dark:border-brand-orange/50 focus:ring-1 focus:ring-primary dark:focus:ring-brand-orange text-foreground dark:text-white">
                                <SelectValue placeholder="Durata" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-card border border-primary/30 dark:border-brand-orange/30 text-foreground">
                            <SelectItem value="40" className="text-xs font-bold uppercase">40 min</SelectItem>
                            <SelectItem value="50" className="text-xs font-bold uppercase">50 min</SelectItem>
                            <SelectItem value="60" className="text-xs font-bold uppercase">60 min</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />

              <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                  <FormItem>
                  <FormLabel className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-brand-orange">Data della Gara</FormLabel>
                  <FormControl>
                      <Input
                      type="date"
                      min={min}
                      max={max}
                      {...field}
                      className="h-11 rounded-xl font-bold uppercase text-xs bg-background dark:bg-black border border-primary/50 dark:border-brand-orange/50 focus-visible:ring-1 focus-visible:ring-primary dark:focus-visible:ring-brand-orange text-foreground dark:text-white"
                      />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
            />

                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger className="h-12 rounded-xl text-xs font-bold uppercase bg-background dark:bg-black border border-primary/50 dark:border-brand-orange/50 focus:ring-1 focus:ring-primary dark:focus:ring-brand-orange text-foreground dark:text-white">
                                <SelectValue placeholder="Stato" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-card border border-primary/30 dark:border-brand-orange/30 text-foreground">
                                <SelectItem value="scheduled" className="text-xs font-bold uppercase">Programmata</SelectItem>
                                <SelectItem value="completed" className="text-xs font-bold uppercase">Finita</SelectItem>
                                <SelectItem value="canceled" className="text-xs font-bold uppercase">Annullata</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />

            <DialogFooter className="pt-4 flex-row gap-2">
              <Button 
                type="button" 
                disabled={isSaving}
                className="flex-1 h-12 rounded-xl font-black uppercase text-xs bg-muted dark:bg-black/40 border border-border dark:border-brand-orange/30 text-foreground dark:text-white hover:bg-muted/80 dark:hover:bg-black/60 transition-all" 
                onClick={() => onOpenChange(false)}
              >
                Annulla
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="flex-1 h-12 rounded-xl bg-primary dark:bg-black border border-primary dark:border-brand-orange text-white font-black uppercase text-xs shadow-[0_0_10px_rgba(172,229,4,0.2)] hover:opacity-90 dark:hover:bg-black/80 hover:scale-[1.02] transition-all"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  "Salva Gara"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
