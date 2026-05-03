"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { settingsRepository, UserSettings } from '@/lib/repositories/settings-repository';

const DEFAULT_SETTINGS: UserSettings = {
  defaultDuration: 90,
  teamName: '',
  matchNotificationEnabled: false,
  matchNotificationTime: '20:00',
};

interface SettingsState extends UserSettings {
  setDefaultDuration: (duration: number) => void;
  setTeamName: (name: string) => void;
  setMatchNotificationEnabled: (val: boolean) => void;
  setMatchNotificationTime: (time: string) => void;
  fetchSettings: (userId: string) => Promise<void>;
  saveSettings: (userId: string, settings: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      setDefaultDuration: (duration) => set({ defaultDuration: duration }),
      setTeamName: (name) => set({ teamName: name }),
      setMatchNotificationEnabled: (val) => set({ matchNotificationEnabled: val }),
      setMatchNotificationTime: (time) => set({ matchNotificationTime: time }),
      resetSettings: () => set({ ...DEFAULT_SETTINGS }),
      fetchSettings: async (userId: string) => {
        if (!userId) return;
        try {
          const settings = await settingsRepository.getSettings(userId);
          if (settings) {
            set({ ...settings });
          } else {
            set({ ...DEFAULT_SETTINGS });
          }
        } catch (error) {
          console.error("Error fetching settings:", error);
        }
      },
      saveSettings: async (userId: string, newSettings: Partial<UserSettings>) => {
        if (!userId) return;
        try {
          set({ ...newSettings });
          const currentSettings = get();
          await settingsRepository.saveSettings(userId, {
            defaultDuration: currentSettings.defaultDuration,
            teamName: currentSettings.teamName,
            matchNotificationEnabled: currentSettings.matchNotificationEnabled,
            matchNotificationTime: currentSettings.matchNotificationTime,
          });
        } catch (error) {
          console.error("Error saving settings:", error);
        }
      }
    }),
    {
      name: 'pitchman-settings',
    }
  )
);
