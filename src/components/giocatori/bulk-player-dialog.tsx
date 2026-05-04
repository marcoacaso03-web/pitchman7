
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Role, ROLES } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BulkPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (players: { name: string, role: Role }[]) => Promise<void>;
}

interface PlayerRow {
  id: string;
  firstName: string;
  lastName: string;
  role: Role;
}

export function BulkPlayerDialog({ open, onOpenChange, onSave }: BulkPlayerDialogProps) {
  const [rows, setRows] = useState<PlayerRow[]>([
    { id: '1', firstName: '', lastName: '', role: 'Centrocampista' },
    { id: '2', firstName: '', lastName: '', role: 'Centrocampista' }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setRows([
        { id: '1', firstName: '', lastName: '', role: 'Centrocampista' },
        { id: '2', firstName: '', lastName: '', role: 'Centrocampista' }
      ]);
    }
  }, [open]);

  const addRow = () => {
    setRows([...rows, { id: Math.random().toString(36).substr(2, 9), firstName: '', lastName: '', role: 'Centrocampista' }]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(rows.filter(row => row.id !== id));
  };

  const updateRow = (id: string, field: keyof PlayerRow, value: string) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleSave = async () => {
    const validPlayers = rows
      .filter(row => row.firstName.trim() !== '' && row.lastName.trim() !== '')
      .map(row => ({
        name: `${row.firstName.trim()} ${row.lastName.trim()}`,
        role: row.role
      }));

    if (validPlayers.length === 0) return;

    setIsSaving(true);
    try {
      await onSave(validPlayers);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save bulk players:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-2xl rounded-2xl p-0 overflow-hidden flex flex-col max-h-[90vh] bg-background dark:bg-black border-none shadow-2xl transition-colors duration-300">
        <DialogHeader className="p-6 pb-4 bg-muted/30 dark:bg-background border-b border-border dark:border-white/5 transition-colors">
          <DialogTitle className="text-foreground dark:text-white font-black uppercase text-xl">Aggiungi in Blocco</DialogTitle>
          <DialogDescription className="text-xs font-medium">
            Inserisci i dati dei giocatori. Nome e Cognome sono obbligatori per il salvataggio.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 bg-background dark:bg-black px-6 transition-colors">
          <div className="space-y-3 py-4">
            {rows.map((row, index) => (
              <div key={row.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-xl bg-muted dark:bg-card/50 border border-border dark:border-white/5">
                <div className="col-span-1 text-[10px] font-black text-muted-foreground flex justify-center">
                  {index + 1}
                </div>
                <div className="col-span-11 sm:col-span-3">
                  <Input 
                    placeholder="Nome" 
                    value={row.firstName}
                    onChange={(e) => updateRow(row.id, 'firstName', e.target.value)}
                    className="h-9 text-xs font-bold uppercase"
                  />
                </div>
                <div className="col-span-11 sm:col-span-3 ml-6 sm:ml-0">
                  <Input 
                    placeholder="Cognome" 
                    value={row.lastName}
                    onChange={(e) => updateRow(row.id, 'lastName', e.target.value)}
                    className="h-9 text-xs font-bold uppercase"
                  />
                </div>
                <div className="col-span-9 sm:col-span-4 ml-6 sm:ml-0">
                  <Select value={row.role} onValueChange={(v) => updateRow(row.id, 'role', v as Role)}>
                    <SelectTrigger className="h-9 text-[10px] font-bold uppercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map(r => <SelectItem key={r} value={r} className="text-xs font-bold uppercase">{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 sm:col-span-1 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive dark:hover:text-red-400"
                    onClick={() => removeRow(row.id)}
                    disabled={rows.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              className="w-full h-10 border-dashed rounded-xl font-bold uppercase text-[10px]"
              onClick={addRow}
            >
              <Plus className="h-3.5 w-3.5 mr-2" />
              Aggiungi riga
            </Button>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2 flex-row gap-2 bg-muted/30 dark:bg-black border-t border-border dark:border-white/5 transition-colors">
          <Button variant="ghost" className="flex-1 rounded-xl font-bold uppercase text-xs h-11 text-foreground dark:text-white hover:bg-muted dark:hover:bg-white/5" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Annulla
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-primary dark:bg-brand-orange text-white dark:text-black hover:opacity-90 dark:hover:bg-brand-orange/90 rounded-xl font-bold uppercase text-xs h-11 shadow-sm transition-all" disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salva Giocatori'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
