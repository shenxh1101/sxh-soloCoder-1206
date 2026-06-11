import { DEFAULT_WORD_LIBRARY } from './defaultWords';
import { STORAGE_KEYS, GAME_CONFIG } from './constants';
import type { WordLibrary, DailyStats, WrongRecord, PracticeConfig } from '@/types';
import { DEFAULT_PRACTICE_CONFIG } from './constants';

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function getWordLibrary(): WordLibrary {
  const stored = safeGet<Partial<WordLibrary>>(STORAGE_KEYS.WORD_LIBRARY, {} as Partial<WordLibrary>);
  return {
    easy: stored.easy ?? DEFAULT_WORD_LIBRARY.easy,
    normal: stored.normal ?? DEFAULT_WORD_LIBRARY.normal,
    hard: stored.hard ?? DEFAULT_WORD_LIBRARY.hard,
    digits: stored.digits ?? DEFAULT_WORD_LIBRARY.digits,
  };
}

export function setWordLibrary(library: WordLibrary): void {
  safeSet(STORAGE_KEYS.WORD_LIBRARY, library);
}

export function resetWordLibrary(): WordLibrary {
  localStorage.removeItem(STORAGE_KEYS.WORD_LIBRARY);
  return JSON.parse(JSON.stringify(DEFAULT_WORD_LIBRARY));
}

export function getDailyStats(): DailyStats[] {
  return safeGet<DailyStats[]>(STORAGE_KEYS.DAILY_STATS, []);
}

export function setDailyStats(stats: DailyStats[]): void {
  safeSet(STORAGE_KEYS.DAILY_STATS, stats);
}

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function emptyModeStats() {
  return {
    duration: 0,
    correctCount: 0,
    wrongCount: 0,
    sessions: 0,
  };
}

export function recordSession(
  durationSec: number,
  correct: number,
  wrong: number,
  modeKey: string = 'all'
): void {
  const all = getDailyStats();
  const today = todayStr();
  const accuracy = correct + wrong > 0 ? correct / (correct + wrong) : 0;

  let idx = all.findIndex(s => s.date === today);
  if (idx === -1) {
    all.push({
      date: today,
      totalDuration: durationSec,
      correctCount: correct,
      wrongCount: wrong,
      accuracy,
      sessions: 1,
      byMode: {
        [modeKey]: {
          duration: durationSec,
          correctCount: correct,
          wrongCount: wrong,
          sessions: 1,
        },
      },
    });
  } else {
    const existing = all[idx];
    const newCorrect = existing.correctCount + correct;
    const newWrong = existing.wrongCount + wrong;
    const byMode = { ...(existing.byMode ?? {}) };
    const prev = byMode[modeKey] ?? emptyModeStats();
    byMode[modeKey] = {
      duration: prev.duration + durationSec,
      correctCount: prev.correctCount + correct,
      wrongCount: prev.wrongCount + wrong,
      sessions: prev.sessions + 1,
    };

    all[idx] = {
      date: today,
      totalDuration: existing.totalDuration + durationSec,
      correctCount: newCorrect,
      wrongCount: newWrong,
      accuracy: newCorrect + newWrong > 0 ? newCorrect / (newCorrect + newWrong) : 0,
      sessions: existing.sessions + 1,
      byMode,
    };
  }

  const sorted = all.sort((a, b) => a.date.localeCompare(b.date));
  const trimmed = sorted.slice(-90);
  setDailyStats(trimmed);
}

export function getHighestCombo(): number {
  return safeGet<number>(STORAGE_KEYS.HIGHEST_COMBO, 0);
}

export function setHighestCombo(combo: number): void {
  const current = getHighestCombo();
  if (combo > current) {
    safeSet(STORAGE_KEYS.HIGHEST_COMBO, combo);
  }
}

export function getLastNDaysStats(n: number): DailyStats[] {
  const all = getDailyStats();
  const result: DailyStats[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const ds = `${y}-${m}-${day}`;
    const found = all.find(s => s.date === ds);
    if (found) {
      result.push(found);
    } else {
      result.push({
        date: ds,
        totalDuration: 0,
        correctCount: 0,
        wrongCount: 0,
        accuracy: 0,
        sessions: 0,
        byMode: {},
      });
    }
  }
  return result;
}

export function getWrongRecords(): WrongRecord[] {
  return safeGet<WrongRecord[]>(STORAGE_KEYS.WRONG_RECORDS, []);
}

export function addWrongRecords(
  items: { text: string; mode?: string }[]
): WrongRecord[] {
  const all = getWrongRecords();
  const now = Date.now();
  const modeKey = items[0]?.mode ?? 'all';

  for (const item of items) {
    const text = item.text;
    const idx = all.findIndex(r => r.text === text);
    if (idx === -1) {
      all.push({
        text,
        count: 1,
        lastSeen: now,
        mode: modeKey,
      });
    } else {
      all[idx].count += 1;
      all[idx].lastSeen = now;
      all[idx].mode = modeKey;
    }
  }

  const sorted = all.sort((a, b) => b.count - a.count || b.lastSeen - a.lastSeen);
  const trimmed = sorted.slice(0, GAME_CONFIG.MAX_WRONG_RECORDS);
  safeSet(STORAGE_KEYS.WRONG_RECORDS, trimmed);
  return trimmed;
}

export function clearWrongRecords(): void {
  localStorage.removeItem(STORAGE_KEYS.WRONG_RECORDS);
}

export function getLastPracticeConfig(): PracticeConfig {
  return safeGet<PracticeConfig>(STORAGE_KEYS.LAST_PRACTICE_CONFIG, DEFAULT_PRACTICE_CONFIG);
}

export function setLastPracticeConfig(config: PracticeConfig): void {
  safeSet(STORAGE_KEYS.LAST_PRACTICE_CONFIG, config);
}
