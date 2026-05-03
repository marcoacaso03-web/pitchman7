
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase-client';
import type { Player, Role } from '@/lib/types';
import { PlayerSchema } from '@/lib/schemas';

export type PlayerCreateData = {
    name: string;
    firstName: string;
    lastName: string;
    role: Role;
    secondaryRoles?: Role[];
    seasonId: string;
    userId: string;
}

export const playerRepository = {
  async getAll(userId: string, seasonId?: string) {
    if (!userId || !seasonId) return [];
    const db = getDb();
    const playersRef = collection(db, 'teams', seasonId, 'players');
    const q = query(playersRef, where('teamOwnerId', '==', userId));
    const snapshot = await getDocs(q);
    const players = snapshot.docs.map(doc => {
      const pData = doc.data();
      
      // Fallback per dati esistenti senza firstName/lastName
      if (!pData.firstName || !pData.lastName) {
        const parts = (pData.name || "").split(" ");
        pData.firstName = parts.shift() || "";
        pData.lastName = parts.join(" ") || pData.firstName;
      }

      const data = { ...pData, id: doc.id };
      const parsed = PlayerSchema.safeParse(data);
      if (!parsed.success) {
        console.error("Schema validation failed for Player:", parsed.error);
        return data as Player;
      }
      return parsed.data;
    });
    return players.sort((a, b) => a.lastName.localeCompare(b.lastName));
  },

  async getById(id: string, seasonId: string) {
    if (!id || !seasonId) return undefined;
    const db = getDb();
    const docRef = doc(db, 'teams', seasonId, 'players', id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as Player : undefined;
  },

  async add(data: PlayerCreateData) {
    const db = getDb();
    // Genera un ID corto e leggibile (es: P-XYZ78)
    const shortRandom = Math.random().toString(36).substring(2, 7).toUpperCase();
    const id = `P-${shortRandom}`;
    
    const newPlayer: Player = {
      id,
      userId: data.userId,
      teamOwnerId: data.userId,
      teamId: data.seasonId,
      seasonId: data.seasonId,
      name: data.name.toUpperCase(),
      firstName: data.firstName.toUpperCase(),
      lastName: data.lastName.toUpperCase(),
      role: data.role,
      secondaryRoles: data.secondaryRoles || [],
      stats: { appearances: 0, goals: 0, assists: 0, avgMinutes: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'teams', data.seasonId, 'players', id), newPlayer);
    return newPlayer;
  },

  async bulkAdd(playersData: { name: string, role: Role }[], userId: string, seasonId: string) {
    const db = getDb();
    const batch = writeBatch(db);
    
    const newPlayers: Player[] = playersData.map((p) => {
      const shortRandom = Math.random().toString(36).substring(2, 7).toUpperCase();
      const id = `P-${shortRandom}`;
      const newPlayer: Player = {
        id,
        userId,
        teamOwnerId: userId,
        teamId: seasonId,
        seasonId,
        name: p.name.toUpperCase(),
        firstName: (p as any).firstName?.toUpperCase() || p.name.split(" ")[0].toUpperCase(),
        lastName: (p as any).lastName?.toUpperCase() || p.name.split(" ").slice(1).join(" ").toUpperCase() || p.name.toUpperCase(),
        role: p.role,
        secondaryRoles: [],
        stats: { appearances: 0, goals: 0, assists: 0, avgMinutes: 0 },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = doc(db, 'teams', seasonId, 'players', id);
      batch.set(docRef, newPlayer);
      return newPlayer;
    });

    await batch.commit();
    return newPlayers;
  },

  async update(id: string, seasonId: string, updates: Partial<Omit<Player, 'id' | 'userId' | 'seasonId'>>) {
    const db = getDb();
    const docRef = doc(db, 'teams', seasonId, 'players', id);
    const updatesWithTimestamp = { 
      ...updates, 
      ...(updates.name && { name: updates.name.toUpperCase() }),
      updatedAt: new Date().toISOString() 
    };
    await updateDoc(docRef, updatesWithTimestamp);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? { ...snapshot.data(), id: snapshot.id } as Player : undefined;
  },

  async delete(id: string, seasonId: string) {
    const db = getDb();
    return await deleteDoc(doc(db, 'teams', seasonId, 'players', id));
  },

  async deleteAll(userId: string, seasonId: string) {
    if (!userId || !seasonId) return;
    const db = getDb();
    const playersRef = collection(db, 'teams', seasonId, 'players');
    const q = query(playersRef, where('teamOwnerId', '==', userId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return;
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
        batch.delete(d.ref);
    });
    await batch.commit();
  }
};
