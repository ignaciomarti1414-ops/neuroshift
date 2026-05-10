import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Session {
  id: string;
  timestamp: number;
  entryVas: number;
  exitVas: number;
  nBackAccuracy: number | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlockedAt: number | null;
  icon: string;
}

export const ACHIEVEMENTS_CONFIG: Achievement[] = [
  { id: 'first_session', name: 'Primer Paso', description: 'Completa tu primera sesión', unlockedAt: null, icon: '🌱' },
  { id: 'streak_7', name: 'Racha Verde', description: 'Mantén una racha de 7 días', unlockedAt: null, icon: '🔥' },
  { id: 'streak_30', name: 'Guerrero del Mes', description: '30 días de consistencia', unlockedAt: null, icon: '⚔️' },
  { id: 'delta_30', name: 'Reseteo Profundo', description: 'Reduce tu VAS en 30+ puntos', unlockedAt: null, icon: '🧠' },
  { id: 'delta_50', name: 'Renacimiento', description: 'Reduce tu VAS en 50+ puntos', unlockedAt: null, icon: '🔄' },
  { id: 'nback_level_2', name: 'Multitarea', description: 'Alcanza nivel 2 en N-Back', unlockedAt: null, icon: '🎯' },
  { id: 'nback_level_3', name: 'Cerebro de Acero', description: 'Alcanza nivel 3 en N-Back', unlockedAt: null, icon: '💎' },
  { id: 'deep_worker', name: 'Deep Worker', description: 'Completa 10 sesiones de Deep Work', unlockedAt: null, icon: '🏗️' },
  { id: 'deep_worker_90', name: 'Arquitecto', description: '10 sesiones de 90 min', unlockedAt: null, icon: '🏛️' },
];

interface AudioConfig {
  volume: number;
  enabled: boolean;
  noiseType: 'white' | 'pink' | 'brown' | 'green' | 'grey';
  haptics: boolean;
  deepWorkHz: number;
}

interface NeuroState {
  hasSeenOnboarding: boolean;
  phase: number;
  entryVas: number;
  exitVas: number;
  audioConfig: AudioConfig;
  history: Session[];
  nBackLevel: number;
  nBackHistory: number[];
  currentNBackAccuracy: number | null;
  coherenceDuration: number;
  streak: number;
  lastSessionDate: string | null;
  achievements: Record<string, number | null>;
  deepWorkSessions: number;
  deepWork90Sessions: number;

  setHasSeenOnboarding: (val: boolean) => void;
  setHistory: (history: Session[]) => void;
  nextPhase: () => void;
  resetSession: () => void;
  setMetrics: (type: 'entry' | 'exit', vas: number) => void;
  setAudioConfig: (config: Partial<AudioConfig>) => void;
  setCoherenceDuration: (duration: number) => void;
  setNBackLevel: (level: number) => void;
  evaluateCognitiveLoad: (accuracy: number) => void;
  purgeData: () => void;
  unlockAchievement: (id: string) => boolean;
  recordSessionComplete: (delta: number) => void;
  recordDeepWorkComplete: (durationMinutes: number) => void;
}

const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  volume: 0.5,
  enabled: true,
  noiseType: 'brown',
  haptics: true,
  deepWorkHz: 15,
};

export const useNeuroStore = create<NeuroState>()(
  persist(
    (set, get) => ({
      hasSeenOnboarding: false,
      phase: 1,
      entryVas: 50,
      exitVas: 50,
      audioConfig: { ...DEFAULT_AUDIO_CONFIG },
      history: [],
      nBackLevel: 1,
      nBackHistory: [],
      currentNBackAccuracy: null,
      coherenceDuration: 180,
      streak: 0,
      lastSessionDate: null,
      achievements: {},
      deepWorkSessions: 0,
      deepWork90Sessions: 0,

      setHasSeenOnboarding: (val) => set({ hasSeenOnboarding: val }),
      setHistory: (history) => set({ history }),

      nextPhase: () => set((state) => ({ phase: Math.min(state.phase + 1, 7) })),

      resetSession: () => set({
        phase: 1,
        entryVas: 50,
        exitVas: 50,
        currentNBackAccuracy: null,
      }),

      setMetrics: (type, vas) => {
        if (type === 'entry') {
          set({ entryVas: vas });
        } else {
          set({ exitVas: vas });
        }
      },

      setAudioConfig: (config) => set((state) => ({ audioConfig: { ...state.audioConfig, ...config } })),

      setCoherenceDuration: (duration) => set({ coherenceDuration: duration }),

      setNBackLevel: (level) => set({ nBackLevel: level }),

      evaluateCognitiveLoad: (accuracy: number) => {
        set((state) => {
          const newHistory = [...state.nBackHistory, accuracy].slice(-3);
          let newLevel = state.nBackLevel;
          const newUnlocks: Record<string, number | null> = {};

          if (newHistory.length === 3) {
            const allAbove90 = newHistory.every((acc) => acc > 90);
            const anyBelow70 = newHistory.some((acc) => acc < 70);

            if (allAbove90) {
              newLevel = Math.min(state.nBackLevel + 1, 3);
            } else if (anyBelow70) {
              newLevel = Math.max(state.nBackLevel - 1, 1);
            }
          }

          if (newLevel >= 2 && state.achievements['nback_level_2'] === null) {
            newUnlocks['nback_level_2'] = Date.now();
          }
          if (newLevel >= 3 && state.achievements['nback_level_3'] === null) {
            newUnlocks['nback_level_3'] = Date.now();
          }

          return {
            currentNBackAccuracy: accuracy,
            nBackHistory: newHistory,
            nBackLevel: newLevel,
            achievements: { ...state.achievements, ...newUnlocks },
          };
        });
      },

      purgeData: () => set({
        history: [],
        nBackLevel: 1,
        nBackHistory: [],
        audioConfig: { ...DEFAULT_AUDIO_CONFIG },
        coherenceDuration: 180,
        streak: 0,
        lastSessionDate: null,
        achievements: {},
        deepWorkSessions: 0,
        deepWork90Sessions: 0,
      }),

      unlockAchievement: (id: string) => {
        const state = get();
        if (state.achievements[id] !== null) return false;
        set((s) => ({ achievements: { ...s.achievements, [id]: Date.now() } }));
        return true;
      },

      recordSessionComplete: (delta: number) => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        let newStreak = state.streak;
        if (state.lastSessionDate === today) {
          newStreak = state.streak;
        } else if (state.lastSessionDate === yesterday) {
          newStreak = state.streak + 1;
        } else if (state.lastSessionDate === null) {
          newStreak = 1;
        } else {
          newStreak = 1;
        }

        const newUnlocks: Record<string, number | null> = {};

        if (state.history.length === 0) {
          if (state.achievements['first_session'] === null) {
            newUnlocks['first_session'] = Date.now();
          }
        }

        if (newStreak >= 7 && state.achievements['streak_7'] === null) {
          newUnlocks['streak_7'] = Date.now();
        }
        if (newStreak >= 30 && state.achievements['streak_30'] === null) {
          newUnlocks['streak_30'] = Date.now();
        }

        if (delta >= 30 && state.achievements['delta_30'] === null) {
          newUnlocks['delta_30'] = Date.now();
        }
        if (delta >= 50 && state.achievements['delta_50'] === null) {
          newUnlocks['delta_50'] = Date.now();
        }

        set((s) => ({
          streak: newStreak,
          lastSessionDate: today,
          achievements: { ...s.achievements, ...newUnlocks },
        }));
      },

      recordDeepWorkComplete: (durationMinutes: number) => {
        const newUnlocks: Record<string, number | null> = {};
        set((state) => {
          const sessions = state.deepWorkSessions + 1;
          const sessions90 = durationMinutes >= 90 ? state.deepWork90Sessions + 1 : state.deepWork90Sessions;

          if (sessions >= 10 && state.achievements['deep_worker'] === null) {
            newUnlocks['deep_worker'] = Date.now();
          }
          if (sessions90 >= 10 && state.achievements['deep_worker_90'] === null) {
            newUnlocks['deep_worker_90'] = Date.now();
          }

          return {
            deepWorkSessions: sessions,
            deepWork90Sessions: sessions90,
            achievements: { ...state.achievements, ...newUnlocks },
          };
        });
      },
    }),
    {
      name: 'neuroshift-storage',
      version: 2,
      partialize: (state) => ({
        hasSeenOnboarding: state.hasSeenOnboarding,
        audioConfig: state.audioConfig,
        history: state.history,
        nBackLevel: state.nBackLevel,
        nBackHistory: state.nBackHistory,
        coherenceDuration: state.coherenceDuration,
        streak: state.streak,
        lastSessionDate: state.lastSessionDate,
        achievements: state.achievements,
        deepWorkSessions: state.deepWorkSessions,
        deepWork90Sessions: state.deepWork90Sessions,
      }),
      migrate: (persistedState: any, fromVersion: number) => {
        if (fromVersion < 2) {
          return {
            ...persistedState,
            coherenceDuration: 180,
            streak: 0,
            lastSessionDate: null,
            achievements: {},
            deepWorkSessions: 0,
            deepWork90Sessions: 0,
          };
        }
        return persistedState;
      },
    }
  )
);

