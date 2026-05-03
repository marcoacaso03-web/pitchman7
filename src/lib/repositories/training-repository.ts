
"use client";

import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase-client';
import type { TrainingSession, TrainingAttendance, TrainingStatus } from '@/lib/types';
import { TrainingSessionSchema } from '@/lib/schemas';

export const trainingRepository = {
  async getAll(userId: string, seasonId: string) {
    const db = getDb();
    const sessionsRef = collection(db, 'users', userId, 'trainingSessions');
    const q = query(sessionsRef, where('seasonId', '==', seasonId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = { ...doc.data(), id: doc.id };
      const parsed = TrainingSessionSchema.safeParse(data);
      if (!parsed.success) {
        console.error("Schema validation failed for TrainingSession:", parsed.error);
        return data as TrainingSession; // Fallback to raw data
      }
      return parsed.data as TrainingSession;
    });
  },

  async getById(userId: string, sessionId: string) {
    const db = getDb();
    const docRef = doc(db, 'users', userId, 'trainingSessions', sessionId);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return undefined;
    const data = { ...snapshot.data(), id: snapshot.id };
    const parsed = TrainingSessionSchema.safeParse(data);
    if (!parsed.success) {
      console.error("Schema validation failed for TrainingSession:", parsed.error);
      return data as TrainingSession;
    }
    return parsed.data as TrainingSession;
  },

  async bulkAdd(sessions: Omit<TrainingSession, 'id'>[], userId: string) {
    const db = getDb();
    const batch = writeBatch(db);
    
    sessions.forEach(s => {
      const id = `TR-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const docRef = doc(db, 'users', userId, 'trainingSessions', id);
      batch.set(docRef, { ...s, id });
      
      // Scrive le sub-collezioni attendance in blocco se presenti
      if (s.attendances && s.attendances.length > 0) {
        s.attendances.forEach(att => {
          const attRef = doc(db, 'users', userId, 'trainingSessions', id, 'attendance', att.playerId);
          batch.set(attRef, { playerId: att.playerId, status: att.status });
        });
      }
    });

    await batch.commit();
  },

  async update(userId: string, sessionId: string, updates: Partial<TrainingSession>) {
    const db = getDb();
    const docRef = doc(db, 'users', userId, 'trainingSessions', sessionId);
    await updateDoc(docRef, updates);
  },

  async delete(userId: string, sessionId: string) {
    const db = getDb();
    const docRef = doc(db, 'users', userId, 'trainingSessions', sessionId);
    await deleteDoc(docRef);
  },

  async deleteMany(userId: string, sessionIds: string[]) {
    const db = getDb();
    const batch = writeBatch(db);
    sessionIds.forEach(id => {
      const docRef = doc(db, 'users', userId, 'trainingSessions', id);
      batch.delete(docRef);
    });
    await batch.commit();
  },

  async getAttendance(userId: string, sessionId: string) {
    const db = getDb();
    const attRef = collection(db, 'users', userId, 'trainingSessions', sessionId, 'attendance');
    const snapshot = await getDocs(attRef);
    return snapshot.docs.map(doc => ({ ...doc.data(), playerId: doc.id } as TrainingAttendance));
  },

  async getAllAttendanceForSeason(userId: string, sessionIds: string[]) {
    const db = getDb();
    const allAttendance: { sessionId: string, attendance: TrainingAttendance[] }[] = [];
    
    // Per un numero limitato di sessioni carichiamo in parallelo
    await Promise.all(sessionIds.map(async (sid) => {
      const att = await this.getAttendance(userId, sid);
      allAttendance.push({ sessionId: sid, attendance: att });
    }));
    
    return allAttendance;
  },

  async setAttendance(userId: string, sessionId: string, playerId: string, status: TrainingStatus) {
    const db = getDb();
    const docRef = doc(db, 'users', userId, 'trainingSessions', sessionId, 'attendance', playerId);
    await setDoc(docRef, { playerId, status });

    // Aggiorniamo anche il documento principale della sessione per avere i count rapidi (denormalizzazione)
    const sessionRef = doc(db, 'users', userId, 'trainingSessions', sessionId);
    
    // Rileggiamo tutti gli 'attendance' aggiornati per questa sessione
    const attRef = collection(db, 'users', userId, 'trainingSessions', sessionId, 'attendance');
    const snapshot = await getDocs(attRef);
    const allAtt = snapshot.docs.map(doc => ({ ...doc.data(), playerId: doc.id }));
    
    await updateDoc(sessionRef, { attendances: allAtt });
  }
};
