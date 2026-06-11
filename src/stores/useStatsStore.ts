import { create } from 'zustand';
import {
  getDailyStats,
  recordSession as saveSession,
  getHighestCombo,
  setHighestCombo,
  getLastNDaysStats,
} from '@/utils/storage';
import type { DailyStats } from '@/types';

interface StatsState {
  highestCombo: number;
  dailyStats: DailyStats[];
  refresh: () => void;
  recordSession: (durationSec: number, correct: number, wrong: number) => void;
  updateHighestCombo: (combo: number) => void;
  getLastDays: (n: number) => DailyStats[];
}

export const useStatsStore = create<StatsState>((set, get) => ({
  highestCombo: 0,
  dailyStats: [],

  refresh: () => {
    set({
      highestCombo: getHighestCombo(),
      dailyStats: getDailyStats(),
    });
  },

  recordSession: (durationSec: number, correct: number, wrong: number) => {
    if (durationSec > 0 || correct > 0 || wrong > 0) {
      saveSession(durationSec, correct, wrong);
      set({ dailyStats: getDailyStats() });
    }
  },

  updateHighestCombo: (combo: number) => {
    setHighestCombo(combo);
    set({ highestCombo: getHighestCombo() });
  },

  getLastDays: (n: number) => {
    return getLastNDaysStats(n);
  },
}));
