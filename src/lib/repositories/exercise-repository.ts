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
  getDoc,
  or,
  orderBy
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase-client';
import type { Exercise } from '@/lib/types';

export const exerciseRepository = {
  async getAll(userId: string) {
    const db = getDb();
    const exercisesRef = collection(db, 'exercises');
    
    // Get both global exercises and private ones belonging to the user
    const q = query(
      exercisesRef, 
      or(
        where('visibility', '==', 'global'),
        where('userId', '==', userId)
      ),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Exercise));
  },

  async create(userId: string, ownerName: string, exercise: Omit<Exercise, 'id' | 'userId' | 'ownerName' | 'createdAt' | 'updatedAt'>) {
    const db = getDb();
    const exercisesRef = collection(db, 'exercises');
    const newDoc = doc(exercisesRef);
    const id = newDoc.id;
    
    const now = new Date().toISOString();
    const data: Exercise = {
      ...exercise,
      id,
      userId,
      ownerName,
      createdAt: now,
      updatedAt: now,
    };
    
    await setDoc(newDoc, data);
    return data;
  },

  async update(exerciseId: string, updates: Partial<Exercise>) {
    const db = getDb();
    const docRef = doc(db, 'exercises', exerciseId);
    
    const now = new Date().toISOString();
    const dataWithTime = {
      ...updates,
      updatedAt: now
    };
    
    await updateDoc(docRef, dataWithTime);
  },

  async delete(exerciseId: string) {
    const db = getDb();
    const docRef = doc(db, 'exercises', exerciseId);
    await deleteDoc(docRef);
  }
};
