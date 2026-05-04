import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Session {
  id: string;
  timestamp: number;
  entryVas: number;
  exitVas: number;
  nBackAccuracy: number | null;
}

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

  setHasSeenOnboarding: (val: boolean) => void;
  nextPhase: () => void;
  resetSession: () => void;
  setMetrics: (type: 'entry' | 'exit', vas: number) => void;
  setAudioConfig: (config: Partial<AudioConfig>) => void;
  setHistory: (history: Session[]) => void;
  
  /**
   * Evaluates the user's cognitive load and adjusts the N-Back difficulty level.
   * Based on the user's performance accuracy in the N-Back task (Fase 4B).
   * 
   * @param {number} accuracy - The user's accuracy percentage (0-100).
   */
  evaluateCognitiveLoad: (accuracy: number) => void;
  purgeData: () => void;
}

export const useNeuroStore = create<NeuroState>()(
  persist(
    (set, get) => ({
      hasSeenOnboarding: false,
      phase: 1,
      entryVas: 50,
      exitVas: 50,
      audioConfig: { volume: 0.5, enabled: true, noiseType: 'brown', haptics: true, deepWorkHz: 15 },
      history: [],
      nBackLevel: 1,
      nBackHistory: [],
      currentNBackAccuracy: null,

      setHasSeenOnboarding: (val) => set({ hasSeenOnboarding: val }),
      setHistory: (history) => set({ history }),
      nextPhase: () => set((state) => ({ phase: Math.min(state.phase + 1, 7) })),
      resetSession: () => {
        set({
          phase: 1,
          entryVas: 50,
          exitVas: 50,
          currentNBackAccuracy: null,
        });
      },
      setMetrics: (type, vas) => {
        if (type === 'entry') {
          set({ entryVas: vas });
        } else {
          set({ exitVas: vas });
        }
      },
      setAudioConfig: (config) => set((state) => ({ audioConfig: { ...state.audioConfig, ...config } })),
      evaluateCognitiveLoad: (accuracy: number) => {
        set((state) => {
          const newHistory = [...state.nBackHistory, accuracy].slice(-3); // retain last 3
          let newLevel = state.nBackLevel;

          if (newHistory.length === 3) {
            const allAbove90 = newHistory.every((acc) => acc > 90);
            const anyBelow70 = newHistory.some((acc) => acc < 70);

            if (allAbove90) {
              newLevel = Math.min(state.nBackLevel + 1, 3);
            } else if (anyBelow70) {
              newLevel = Math.max(state.nBackLevel - 1, 1);
            }
          }

          return {
            currentNBackAccuracy: accuracy,
            nBackHistory: newHistory,
            nBackLevel: newLevel,
          };
        });
      },
      purgeData: () => set({ history: [], nBackLevel: 1, nBackHistory: [], audioConfig: { volume: 0.5, enabled: true, noiseType: 'brown', haptics: true, deepWorkHz: 15 } }),
    }),
    {
      name: 'neuroshift-storage',
      partialize: (state) => ({ 
        hasSeenOnboarding: state.hasSeenOnboarding,
        audioConfig: state.audioConfig, 
        history: state.history, 
        nBackLevel: state.nBackLevel, 
        nBackHistory: state.nBackHistory 
      }),
    }
  )
);

