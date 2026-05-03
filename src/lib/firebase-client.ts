/**
 * Centralized Firebase client helper.
 * Always use getDb() in repositories instead of calling getFirestore() directly,
 * to ensure we always get the Firestore instance tied to the initialized Firebase app.
 */
import { getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export function getDb() {
  try {
    const app = getApp();
    return getFirestore(app);
  } catch {
    // Fallback: no app initialized yet, use default
    return getFirestore();
  }
}
