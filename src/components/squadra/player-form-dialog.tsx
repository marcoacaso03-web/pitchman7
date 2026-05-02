
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Globe, Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Player, Role, ROLES } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formSchema = z.object({
  firstName: z.string().min(2, { message: "Il nome è richiesto." }),
  lastName: z.string().min(2, { message: "Il cognome è richiesto." }),
  role: z.enum(ROLES, { required_error: "Il ruolo è richiesto."}),
  secondaryRoles: z.array(z.enum(ROLES)).default([]),
});

type FormValues = z.infer<typeof formSchema>;

type PlayerSaveData = {
  name: string;
  firstName: string;
  lastName: string;
  role: Role;
  secondaryRoles: Role[];
};

interface PlayerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: PlayerSaveData, playerId?: string) => Promise<void> | void;
  player?: Player | null;
  onAIImport?: () => void;
}

export function PlayerFormDialog({ open, onOpenChange, onSave, player, onAIImport }: PlayerFormDialogProps) {
  const [isSaving, setIsSaving] = React.useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      role: "Centrocampista",
      secondaryRoles: [],
    },
});

  React.useEffect(() => {
    if (open) {
      if (player) {
          const nameParts = player.name.split(' ');
          const firstName = nameParts.shift() || '';
          const lastName = nameParts.join(' ');
          form.reset({
              firstName,
              lastName,
              role: player.role,
              secondaryRoles: player.secondaryRoles || [],
          });
      } else {
          form.reset({
              firstName: "",
              lastName: "",
              role: "Centrocampista",
              secondaryRoles: [],
          });
      }
    }
  }, [player, open, form]);

  async function onSubmit(data: FormValues) {
    setIsSaving(true);
    try {
      const saveData: PlayerSaveData = {
        name: `${data.firstName} ${data.lastName}`.trim(),
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        secondaryRoles: data.secondaryRoles as Role[]
      };
      await onSave(saveData, player?.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="sm:max-w-[425px] rounded-[28px] bg-card dark:bg-black border border-border dark:border-brand-green/30 shadow-xl dark:shadow-[0_0_25px_rgba(172,229,4,0.05)] p-6 overflow-hidden">
        <DialogHeader className="flex-row items-start justify-between space-y-0">
          <div className="space-y-1 text-left">
            <DialogTitle className="text-foreground dark:text-white font-black uppercase text-xl md:text-2xl tracking-tight">
              {player ? "Modifica Giocatore" : "Nuovo Giocatore"}
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Dettagli anagrafici e ruolo tecnico in rosa.
            </DialogDescription>
          </div>
          {!player && (
            <div className="flex gap-2 ml-4">
              <Button 
                onClick={onAIImport}
                variant="ghost"
                size="icon"
                disabled={isSaving}
                className="h-10 w-10 rounded-full bg-primary/10 dark:bg-brand-green/10 text-primary dark:text-brand-green hover:bg-primary/20 dark:hover:bg-brand-green/20"
                title="Importazione AI"
              >
                <Sparkles className="h-5 w-5" />
              </Button>

            </div>
          )}
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1">Nome</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Mario" 
                        {...field} 
                        disabled={isSaving}
                        className="h-11 text-xs font-black uppercase rounded-xl bg-background dark:bg-black border border-border dark:border-brand-green/20 focus-visible:ring-1 focus-visible:ring-primary dark:focus-visible:ring-brand-green focus-visible:border-primary dark:focus-visible:border-brand-green transition-all" 
                      />
                    </FormControl>
                    <FormMessage className="text-[9px] font-bold uppercase" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1">Cognome</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Rossi" 
                        {...field} 
                        disabled={isSaving}
                        className="h-11 text-xs font-black uppercase rounded-xl bg-background dark:bg-black border border-border dark:border-brand-green/20 focus-visible:ring-1 focus-visible:ring-primary dark:focus-visible:ring-brand-green focus-visible:border-primary dark:focus-visible:border-brand-green transition-all" 
                      />
                    </FormControl>
                    <FormMessage className="text-[9px] font-bold uppercase" />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1">Ruolo Tecnico</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={isSaving}>
                        <FormControl>
                            <SelectTrigger className="h-11 text-xs font-black uppercase rounded-xl bg-background dark:bg-black border border-border dark:border-brand-green/20 focus:ring-1 focus:ring-primary dark:focus:ring-brand-green focus:border-primary dark:focus:border-brand-green transition-all">
                                <SelectValue placeholder="Seleziona ruolo" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-border dark:border-brand-green/30 bg-card dark:bg-background">
                            {ROLES.map(role => (
                                <SelectItem key={role} value={role} className="text-xs font-black uppercase focus:bg-primary/10 dark:focus:bg-brand-green/10 focus:text-primary dark:focus:text-brand-green transition-colors">
                                  {role}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage className="text-[9px] font-bold uppercase" />
                  </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="secondaryRoles"
              render={() => (
                <FormItem className="space-y-3 p-4 bg-muted/30 dark:bg-white/5 rounded-2xl border border-divider dark:border-white/5">
                  <div className="space-y-0.5">
                    <FormLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/80 ml-1">Ruoli Secondari</FormLabel>
                    <FormDescription className="text-[8px] font-bold uppercase text-muted-foreground/40 ml-1">
                      Seleziona altri ruoli in cui il giocatore può adattarsi.
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {ROLES.map((role) => {
                      // Non mostrare il ruolo primario selezionato
                      if (role === form.watch('role')) return null;
                      
                      return (
                        <FormField
                          key={role}
                          control={form.control}
                          name="secondaryRoles"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={role}
                                className="flex flex-row items-center space-x-2 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(role)}
                                    disabled={isSaving}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, role])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== role
                                            )
                                          )
                                    }}
                                    className="border-primary/30 dark:border-brand-green/30 data-[state=checked]:bg-primary dark:data-[state=checked]:bg-brand-green data-[state=checked]:text-white dark:data-[state=checked]:text-black"
                                  />
                                </FormControl>
                                <FormLabel className="text-[10px] font-black uppercase tracking-tight text-foreground dark:text-white/80 cursor-pointer">
                                  {role}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      )
                    })}
                  </div>
                  <FormMessage className="text-[9px] font-bold uppercase" />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-6 flex-row gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                disabled={isSaving}
                className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest h-12 text-muted-foreground hover:bg-muted dark:hover:bg-white/5 transition-all" 
                onClick={() => onOpenChange(false)}
              >
                Annulla
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="flex-1 bg-primary dark:bg-black border-2 border-primary dark:border-brand-green text-white dark:text-brand-green font-black uppercase text-[10px] tracking-widest h-12 shadow-sm dark:shadow-[0_0_15px_rgba(172,229,4,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  "Salva"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
