import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc,
  arrayUnion,
  writeBatch,
  or
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase-client';
import type { Season } from '@/lib/types';
import { SeasonSchema } from '@/lib/schemas';

export const seasonRepository = {
    async getAll(userId: string) {
        if (!userId) return [];
        const db = getDb();
        const seasonsRef = collection(db, 'teams');
        
        // Fetch seasons where user is owner OR where user is in sharedWith array
        const q = query(
          seasonsRef, 
          or(
            where('ownerId', '==', userId),
            where('sharedWith', 'array-contains', userId)
          )
        );
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
          const data = { ...doc.data(), id: doc.id };
          const parsed = SeasonSchema.safeParse(data);
          if (!parsed.success) {
            console.error("Schema validation failed for Season:", parsed.error);
            return data as Season;
          }
          return parsed.data as Season;
        });
    },

    async getById(id: string) {
        if (!id) return undefined;
        const db = getDb();
        const docRef = doc(db, 'teams', id);
        const snapshot = await getDoc(docRef);
        return snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as Season : undefined;
    },

    async getActive(userId: string) {
        if (!userId) return undefined;
        const seasons = await this.getAll(userId);
        return seasons.find(s => s.isActive);
    },

    async add(name: string, userId: string) {
        const db = getDb();
        const shortRandom = Math.random().toString(36).substring(2, 7).toUpperCase();
        const id = `S-${shortRandom}`;
        
        const newSeason: Season = { 
            id, 
            userId, 
            ownerId: userId, 
            name, 
            isActive: false,
            sharedWith: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'teams', id), newSeason);
        return newSeason;
    },

    async joinSeason(seasonId: string, userId: string) {
        const db = getDb();
        const seasonRef = doc(db, 'teams', seasonId);
        const seasonSnap = await getDoc(seasonRef);
        
        if (!seasonSnap.exists()) {
            throw new Error("Stagione non trovata. Controlla il codice d'invito.");
        }
        
        const seasonData = seasonSnap.data() as Season;
        if (seasonData.ownerId === userId) {
            throw new Error("Sei già il proprietario di questa stagione.");
        }
        
        if (seasonData.sharedWith?.includes(userId)) {
            throw new Error("Hai già partecipato a questa stagione.");
        }
        
        await updateDoc(seasonRef, {
            sharedWith: arrayUnion(userId),
            updatedAt: new Date().toISOString()
        });
        
        return seasonSnap.id;
    },

    async setActive(id: string, userId: string) {
        if (!userId) return;
        const db = getDb();
        const batch = writeBatch(db);
        
        // Fetch all seasons the user has access to
        const seasons = await this.getAll(userId);
        
        // Deactivate all that are currently active
        seasons.forEach(season => {
            if (season.isActive && season.id !== id) {
                batch.update(doc(db, 'teams', season.id), { isActive: false, updatedAt: new Date().toISOString() });
            }
        });
        
        // Activate target season
        batch.update(doc(db, 'teams', id), { isActive: true, updatedAt: new Date().toISOString() });
        
        await batch.commit();
    },

    async delete(id: string) {
        const db = getDb();
        const docRef = doc(db, 'teams', id);
        return await writeBatch(db).delete(docRef).commit();
    },

    async rename(id: string, newName: string) {
        const db = getDb();
        const docRef = doc(db, 'teams', id);
        return await updateDoc(docRef, { 
            name: newName, 
            updatedAt: new Date().toISOString() 
        });
    },

    async ensureDefaultSeason(userId: string) {
        if (!userId) return undefined;
        
        const all = await this.getAll(userId);
        const activeSeasons = all.filter(s => s.isActive);
        
        if (activeSeasons.length === 1) {
            return activeSeasons[0];
        }

        if (all.length > 0) {
            const targetId = activeSeasons.length > 1 ? activeSeasons[0].id : all[0].id;
            await this.setActive(targetId, userId);
            const updatedSeasons = await this.getAll(userId);
            return updatedSeasons.find(s => s.id === targetId);
        }
        
        const defaultId = `S-DEFAULT-${userId.substring(0, 6).toUpperCase()}`;
        const db = getDb();
        
        const initialSeason: Season = { 
            id: defaultId, 
            userId, 
            ownerId: userId, 
            name: '2025/26', 
            isActive: true,
            sharedWith: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'teams', defaultId), initialSeason);
        return initialSeason;
    }
};
