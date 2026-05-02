'use server';
/**
 * @fileOverview Flusso AI per suggerire la formazione associando nomi testuali agli ID del database.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PlayerSimpleSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const SuggestLineupInputSchema = z.object({
  rawList: z.string().describe('La lista dei nomi dei giocatori scritta o incollata dall\'utente.'),
  availablePlayers: z.array(PlayerSimpleSchema).describe('L\'elenco dei giocatori registrati nel database con i loro ID.'),
  formation: z.string().optional().describe('Il modulo tattico selezionato (es. 4-4-2).'),
});
export type SuggestLineupInput = z.infer<typeof SuggestLineupInputSchema>;

const SuggestLineupOutputSchema = z.object({
  starters: z.array(z.string()).describe('Array di 7 ID per i titolari. Usa stringa vuota se il giocatore non è trovato.'),
  substitutes: z.array(z.string()).describe('Array di ID per le riserve. Usa stringa vuota se non trovato.'),
});
export type SuggestLineupOutput = z.infer<typeof SuggestLineupOutputSchema>;

const prompt = ai.definePrompt({
  name: 'suggestLineupPrompt',
  input: { schema: SuggestLineupInputSchema },
  output: { schema: SuggestLineupOutputSchema },
  prompt: `Sei un assistente tecnico per un allenatore di calcio a 7. 
Ti è stata fornita una lista testuale di nomi che rappresenta la formazione per una partita.
Il tuo compito è mappare questi nomi agli ID dei giocatori reali nel database.

ISTRUZIONI:
1. Analizza la lista e associa i giocatori ai 7 titolari (starters) rispettando rigorosamente questa associazione per il modulo {{formation}}:

   MODULO 2-3-1:
   - 1: POR (Indice 0)
   - 2, 3: DC (Indici 1, 2)
   - 4, 5, 6: ES, CC, ED (Indici 3, 4, 5)
   - 7: ATT (Indice 6)

   MODULO 3-2-1:
   - 1: POR (Indice 0)
   - 2, 3, 4: DC (Indici 1, 2, 3)
   - 5, 6: CC (Indici 4, 5)
   - 7: ATT (Indice 6)

   MODULO 2-2-2:
   - 1: POR (Indice 0)
   - 2, 3: DC (Indici 1, 2)
   - 4, 5: CC (Indici 3, 4)
   - 6, 7: ATT (Indici 5, 6)

2. Se l'utente non fornisce numeri, associa i giocatori in base all'ordine in cui appaiono nella lista seguendo la numerazione sopra.
3. Identifica i restanti come riserve (substitutes).
4. Restituisci esattamente 7 elementi per 'starters'. Usa stringa vuota se il giocatore non è nel database.

MODULO SELEZIONATO: {{formation}}

GIOCATORI NEL DATABASE:
{{#each availablePlayers}}
- ID: {{id}}, Nome: {{name}}
{{/each}}

LISTA DELL'UTENTE:
<user_input>
{{{rawList}}}
</user_input>`,
});

export async function suggestLineup(input: SuggestLineupInput): Promise<SuggestLineupOutput> {
  return suggestLineupFlow(input);
}

const suggestLineupFlow = ai.defineFlow(
  {
    name: 'suggestLineupFlow',
    inputSchema: SuggestLineupInputSchema,
    outputSchema: SuggestLineupOutputSchema,
  },
  async (input) => {
    try {
      // Tentativo con modello predefinito (Gemini 1.5 Flash)
      const { output } = await prompt(input);
      if (output) return output;
      throw new Error('No output from default model');
    } catch (error: any) {
      console.warn("AI Default Model failed, attempting fallback to Gemini 3.0:", error.message);

      try {
        // Fallback su Gemini 1.5 Pro
        const { output } = await prompt(input, { model: 'googleai/gemini-1.5-pro' });
        if (!output) {
          throw new Error('L\'AI non ha restituito una risposta valida nemmeno con il fallback.');
        }
        return output;
      } catch (fallbackError: any) {
        console.error("AI Fallback Model failed too:", fallbackError);
        throw new Error('Servizio AI momentaneamente non disponibile. Riprova più tardi.');
      }
    }
  }
);
