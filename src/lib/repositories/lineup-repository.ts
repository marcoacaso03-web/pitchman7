import { 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase-client';
import type { MatchLineup } from '@/lib/types';

export const lineupRepository = {
    async getForMatch(matchId: string, seasonId: string, userId: string) {
        if (!matchId || !seasonId || !userId) return undefined;
        const db = getDb();
        const docRef = doc(db, 'teams', seasonId, 'matches', matchId, 'lineup', 'primary');
        const snapshot = await getDoc(docRef);
        
        if (snapshot.exists()) {
            const data = snapshot.data();
            // Verifica manuale della proprietà per sicurezza aggiuntiva
            if (data.teamOwnerId === userId) {
                return data as MatchLineup;
            }
        }
        return undefined;
    },

    async save(lineup: MatchLineup, seasonId: string, userId: string) {
        if (!lineup.matchId || !seasonId || !userId) return lineup;
        const db = getDb();
        const docRef = doc(db, 'teams', seasonId, 'matches', lineup.matchId, 'lineup', 'primary');
        const lineupWithAuth = {
            ...lineup,
            teamOwnerId: userId,
            updatedAt: new Date().toISOString()
        };
        await setDoc(docRef, lineupWithAuth);
        return lineupWithAuth;
    }
};
