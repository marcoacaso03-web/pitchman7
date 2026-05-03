import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getDb } from '@/lib/firebase-client';

export interface UserSettings {
  defaultDuration: number;
  sessionsPerWeek: number;
  trainingDays: number[];
  autoSetPresenceOnGenerate: boolean;
  teamName: string;
  matchNotificationEnabled?: boolean;
  matchNotificationTime?: string;
  trainingNotificationEnabled?: boolean;
  trainingNotificationTime?: string;
}

export const settingsRepository = {
  async getSettings(userId: string): Promise<UserSettings | null> {
    if (!userId) return null;
    const db = getDb();
    const docRef = doc(db, 'settings', userId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserSettings;
    }
    return null;
  },

  async saveSettings(userId: string, settings: UserSettings): Promise<void> {
    if (!userId) return;
    const db = getDb();
    const docRef = doc(db, 'settings', userId);
    await setDoc(docRef, settings, { merge: true });
  }
};
