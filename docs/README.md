# ⚽ PitchMan 7
### Il sistema operativo intelligente per il Calcio a 7

PitchMan 7 è una versione specializzata della piattaforma avanzata PitchMan, ottimizzata per il **Calcio a 7**. Progettata per allenatori e staff tecnico, si focalizza sull'ottimizzazione della gestione della squadra, dell'analisi tattica (con moduli specifici per il C7) e del monitoraggio delle performance tramite Intelligenza Artificiale.

---

## 🚀 Caratteristiche Principali

- **🧠 AI Tactical Assistant**: Integrazione con **Google Gemini 2.5 Flash** via **Genkit** per analisi partite, suggerimento formazioni e chatbot statistico.
- **🏃‍♂️ Gestione Rosa (Rosa)**: Strumenti avanzati per il monitoraggio dei giocatori, confronto tecnico e gestione degli infortuni.
- **📡 Scouting**: Modulo dedicato alla ricerca di talenti e gestione delle categorie di osservazione.
- **📊 Analytics**: Dashboard interattive con **Recharts** per il monitoraggio di gol, performance e record della stagione.
- **🏋️‍♂️ Training Lab**: Libreria esercizi con supporto **Multimodal AI Vision** per l'importazione automatica da immagini/video tramite **Vercel Blob**.
- **📱 PWA & Offline-First**: Ottimizzata per l'uso sul campo, con persistenza locale via **IndexedDB (Dexie)**.
- **🔄 Team Sync**: Sincronizzazione automatica delle impostazioni e dei dati tra diversi dispositivi.

---

## 🛠️ Tech Stack

- **Core**: [Next.js 15](https://nextjs.org/) (App Router), TypeScript, React 19.
- **Backend/DB**: [Firebase](https://firebase.google.com/) (Firestore, Auth), [Vercel Blob](https://vercel.com/docs/storage/vercel-blob).
- **AI**: [Google Genkit](https://js.genkit.dev/), Gemini 2.5 Flash.
- **UI/UX**: [Tailwind CSS](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/), Lucide Icons, Framer Motion.
- **State Management**: [Zustand](https://docs.pmnd.rs/zustand).
- **Charts**: [Recharts](https://recharts.org/).
- **Database Locale**: [Dexie.js](https://dexie.org/).

---

## 📁 Struttura del Progetto

### 📂 `src/app` (Pagine)
- `allenamento/`: Sessioni, report e libreria esercizi.
- `altro/`: Gestione squadra, impostazioni e profilo coach.
- `calendario/`: Dettaglio partite e gestione cronaca live.
- `membri/`: Gestione della rosa (Rosa) e confronto giocatori.
- `scout/`: Modulo scouting.
- `statistiche/`: Insight analitici e performance.

### 📂 `src/components` (UI)
- `layout/`: Componenti strutturali (`app-header`, `bottom-nav`).
- `ui/`: Componenti atomici base (Shadcn).
- `allenamento/`, `giocatori/`, `partite/`, `squadra/`: Componenti di dominio specifici.

### 📂 `src/services` & `src/ai` (Logica & AI)
- `ai/flows/`: Workflow AI (importazioni, suggerimenti, chatbot).
- `services/ai.service.ts`: Service layer astratto per l'interazione con i flussi Genkit.
- `lib/repositories/`: Logica CRUD e Query Firestore (Repository Pattern).

---

## 📖 Documentazione Aggiuntiva

Per approfondimenti, consulta i documenti nella cartella `docs/`:
- [Roadmap & Progetti](PROJECTS.md)
- [Guida alle Pagine](Pages.md)
- [Design System & Stili](Stili.md)

---
*PitchMan — Sviluppato con ❤️ per il calcio moderno.*