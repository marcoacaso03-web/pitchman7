export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export const FAQ_DATA: FAQItem[] = [
  // 🚀 Primo Avvio
  {
    category: "Primo Avvio",
    question: "Come configuro la mia squadra per la prima volta?",
    answer: "Vai nelle Impostazioni (icona ingranaggio in basso) e cerca la sezione \"Gestione Squadra\". Da lì puoi impostare il nome della squadra, la categoria e le tue preferenze. Questo è il primo passo per iniziare a usare l'app."
  },
  {
    category: "Primo Avvio",
    question: "Come inserisco la rosa dei giocatori?",
    answer: "Hai due opzioni:\n\n• Manuale: Vai nella sezione \"Rosa\" e premi \"+\" per aggiungere i giocatori uno alla volta.\n• Import AI (Premium): Usa il bottone \"Importa\" per incollare del testo (es. da un PDF o una foto) e l'AI estrarrà automaticamente nomi, ruoli e numeri di maglia.\n\nAssicurati di assegnare i ruoli (Portiere, Difensore, Centrocampista, Attaccante) per sbloccare le analisi tattiche."
  },
  {
    category: "Primo Avvio",
    question: "Come inserisco il calendario delle partite?",
    answer: "Hai due opzioni:\n\n• Import AI (Premium): Incolla il testo del calendario e l'AI lo trasformerà in partite strutturate.\n• Manuale: Premi \"NUOVA\" per aggiungere singole partite (amichevoli, recuperi, tornei)."
  },
  // ⚽ Partite
  {
    category: "Partite",
    question: "Come registro il risultato di una partita?",
    answer: "Apri la partita dalla sezione \"Partite\", vai nella tab \"Risultato\" e inserisci il punteggio finale. Da lì puoi anche segnare marcatori, assist e voti individuali."
  },
  {
    category: "Partite",
    question: "Come inserisco gol, cartellini e sostituzioni?",
    answer: "Nella scheda della partita, usa la tab \"Cronaca\" per aggiungere gli eventi in ordine cronologico: gol, assist, cartellini gialli/rossi, sostituzioni e note tattiche."
  },
  {
    category: "Partite",
    question: "Posso aggiungere amichevoli o partite fuori calendario?",
    answer: "Sì! Nella sezione \"Partite\", premi \"NUOVA\" e seleziona il tipo di partita. Le amichevoli vengono tracciate separatamente nelle statistiche."
  },
  // 👥 Rosa
  {
    category: "Rosa & Giocatori",
    question: "Come segnalo un infortunio?",
    answer: "Nella scheda del giocatore, c'è la sezione \"Infortuni\". Premi \"+\" per registrare un nuovo infortunio con data, tipo e tempo di recupero. I giocatori infortunati vengono evidenziati nella rosa e esclusi dai suggerimenti formazione."
  },
  {
    category: "Rosa & Giocatori",
    question: "Come funziona lo Scouting?",
    answer: "Dalla sezione \"Rosa\", tocca l'icona della lente d'ingrandimento per accedere allo Scout. Puoi aggiungere giocatori osservati, assegnare categorie di priorità (\"Priorità Alta\", \"Da Seguire\") e prendere appunti."
  },
  // 📊 Statistiche
  {
    category: "Statistiche",
    question: "Quali statistiche sono disponibili?",
    answer: "La sezione \"Statistiche\" offre: classifica marcatori e assistman, andamento risultati (grafico V/P/S), minutaggio medio per giocatore, cartellini e sanzioni, e rendimento per ruolo."
  },
  {
    category: "Statistiche",
    question: "Le statistiche si aggiornano automaticamente?",
    answer: "Sì! Le statistiche si aggiornano ogni volta che inserisci un risultato, degli eventi di partita o delle presenze. Non devi fare nulla di manuale."
  },
  // 🤖 AI
  {
    category: "AI Assistant",
    question: "Cosa può fare l'assistente AI?",
    answer: "L'AI può: analizzare le statistiche e fornirti insight tattici, suggerire formazioni basate su rendimento e disponibilità, rispondere a domande come \"Chi è il mio miglior marcatore?\" o \"Come stiamo andando in questo torneo?\", e aiutarti a usare l'app."
  },
  {
    category: "AI Assistant",
    question: "L'AI inventa dati?",
    answer: "No. L'AI è programmata per basarsi esclusivamente sui dati reali della tua squadra. Se non ha abbastanza dati, te lo dirà. Non inventerà mai statistiche."
  },
  // 🔗 Collaborazione
  {
    category: "Collaborazione",
    question: "Come condivido la stagione con un collaboratore?",
    answer: "Nelle Impostazioni, cerca \"Condivisione\" e copia il tuo \"Codice Stagione\". Condividilo con il collaboratore: potrà inserirlo nella sua app per accedere ai dati della tua squadra."
  },
  // 💎 Pro
  {
    category: "Piano Pro",
    question: "Cosa include il piano gratuito?",
    answer: "Il piano Free include: gestione completa della rosa, inserimento manuale partite e risultati, note tattiche e gestione base dei tornei."
  },
  {
    category: "Piano Pro",
    question: "Cosa include il piano Pro?",
    answer: "Il piano Pro aggiunge: AI Assistant illimitato, Import AI (da testo, foto o PDF), statistiche avanzate (grafici, trend, medie), export PDF/CSV e libreria esercizi sociale."
  },
  {
    category: "Piano Pro",
    question: "C'è un periodo di prova?",
    answer: "Sì! Ogni nuovo account riceve 24 ore di accesso completo a tutte le funzionalità Pro. Puoi importare la rosa, il calendario, provare l'AI e vedere le statistiche prima di decidere."
  },
  // 🔒 Privacy
  {
    category: "Privacy & Sicurezza",
    question: "I miei dati sono al sicuro?",
    answer: "Sì. PitchMan usa Firebase di Google per autenticazione e database. I tuoi dati sono criptati in transito e a riposo. Ogni utente vede solo i dati della propria squadra."
  },
  {
    category: "Privacy & Sicurezza",
    question: "Chi può vedere i dati della mia squadra?",
    answer: "Solo tu e le persone con cui hai condiviso il Codice Stagione. Il Direttore Sportivo (se presente) può vedere risultati e statistiche in sola lettura, ma non può modificare nulla."
  },
];
