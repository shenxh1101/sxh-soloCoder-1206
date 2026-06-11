import { create } from 'zustand';
import {
  getDailyStats,
  recordSession as saveSession,
  getHighestCombo,
  setHighestCombo,
  getLastNDaysStats,
  getWrongRecords,
  addWrongRecords,
  clearWrongRecords as clearWrong,
} from '@/utils/storage';
import type { DailyStats, WrongRecord } from '@/types';

interface WrongWordInput {
  text: string;
  count?: number;
  mode?: string;
}

interface StatsState {
  highestCombo: number;
  dailyStats: DailyStats[];
  wrongRecords: WrongRecord[];
  refresh: () => void;
  recordSession: (durationSec: number, correct: number, wrong: number, mode?: string) => void;
  updateHighestCombo: (combo: number) => void;
  getLastDays: (n: number) => DailyStats[];
  addWrongWords: (words: WrongWordInput[]) => void;
  clearWrongRecords: () => void;
  getTopWrong: (n: number) => WrongRecord[];
}

export const useStatsStore = create<StatsState>((set, get) => ({
  highestCombo: 0,
  dailyStats: [],
  wrongRecords: [],

  refresh: () => {
    set({
      highestCombo: getHighestCombo(),
      dailyStats: getDailyStats(),
      wrongRecords: getWrongRecords(),
    });
  },

  recordSession: (durationSec: number, correct: number, wrong: number, mode = 'all') => {
    if (durationSec > 0 || correct > 0 || wrong > 0) {
      saveSession(durationSec, correct, wrong, mode);
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

  addWrongWords: (words: WrongWordInput[]) => {
    if (words.length === 0) return;
    const items = words.map(w => ({
      text: w.text,
      mode: w.mode ?? 'all',
    }));
    const updated = addWrongRecords(items);
    set({ wrongRecords: updated });
  },

  clearWrongRecords: () => {
    clearWrong();
    set({ wrongRecords: [] });
  },

  getTopWrong: (n: number) => {
    return get().wrongRecords.slice(0, n);
  },
}));
