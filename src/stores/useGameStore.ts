import { create } from 'zustand';
import { GAME_CONFIG, DIFFICULTY_CONFIG, DEFAULT_PRACTICE_CONFIG, pickWordsForPractice } from '@/utils/constants';
import { useWordStore } from './useWordStore';
import { useStatsStore } from './useStatsStore';
import { getLastPracticeConfig, setLastPracticeConfig } from '@/utils/storage';
import type {
  GameStatus,
  Difficulty,
  FallingItem,
  FloatingScore,
  PracticeConfig,
  PracticeMode,
  WrongRecord as WrongRecordType,
} from '@/types';

let itemIdCounter = 0;
let floatIdCounter = 0;

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${(++itemIdCounter).toString(36)}`;
}

interface WrongRecordLocal {
  text: string;
  count: number;
}

interface GameActions {
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  restartGame: () => void;
  endGame: () => void;
  setDifficulty: (d: Difficulty) => void;
  setPracticeConfig: (cfg: PracticeConfig) => void;
  setPracticeMode: (mode: PracticeMode, customChars?: string[]) => void;
  spawnItem: (areaWidth: number) => void;
  updateItems: (deltaMs: number, areaHeight: number) => void;
  processKey: (key: string, areaHeightPx?: number) => { handled: boolean; correct: boolean };
  setActiveKey: (k: string | null) => void;
  cleanupFloatingScores: (now: number) => void;
  clearScreenFlash: () => void;
  getElapsedSeconds: () => number;
  getSessionDurationSec: () => number;
}

interface GameState extends GameActions {
  status: GameStatus;
  difficulty: Difficulty;
  practiceConfig: PracticeConfig;
  score: number;
  lives: number;
  maxLives: number;
  combo: number;
  maxCombo: number;
  startTime: number | null;
  endTime: number | null;
  pausedTime: number;
  totalPausedTime: number;
  sessionDuration: number;
  correctCount: number;
  wrongCount: number;
  wrongDetails: WrongRecordLocal[];
  fallingItems: FallingItem[];
  activeKey: string | null;
  floatingScores: FloatingScore[];
  screenFlash: { type: 'milestone' | 'error' | null; time: number };
}

const initialState: Omit<GameState, keyof GameActions> = {
  status: 'idle',
  difficulty: 'normal',
  practiceConfig: DEFAULT_PRACTICE_CONFIG,
  score: 0,
  lives: GAME_CONFIG.MAX_LIVES,
  maxLives: GAME_CONFIG.MAX_LIVES,
  combo: 0,
  maxCombo: 0,
  startTime: null,
  endTime: null,
  pausedTime: 0,
  totalPausedTime: 0,
  sessionDuration: 0,
  correctCount: 0,
  wrongCount: 0,
  wrongDetails: [],
  fallingItems: [],
  activeKey: null,
  floatingScores: [],
  screenFlash: { type: null, time: 0 },
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  startGame: () => {
    const stats = useStatsStore.getState();
    stats.refresh();
    const prevDifficulty = get().difficulty;
    const prevConfig = get().practiceConfig;
    set({
      ...initialState,
      difficulty: prevDifficulty,
      practiceConfig: prevConfig,
      status: 'playing',
      startTime: performance.now(),
    });
  },

  pauseGame: () => {
    const s = get();
    if (s.status !== 'playing') return;
    set({
      status: 'paused',
      pausedTime: performance.now(),
    });
  },

  resumeGame: () => {
    const s = get();
    if (s.status !== 'paused') return;
    const pausedDelta = performance.now() - s.pausedTime;
    set({
      status: 'playing',
      pausedTime: 0,
      totalPausedTime: s.totalPausedTime + pausedDelta,
    });
  },

  restartGame: () => {
    get().endGame();
    get().startGame();
  },

  endGame: () => {
    const s = get();
    if (s.status === 'idle') return;
    const endTime = performance.now();
    const duration = Math.floor(s.getSessionDurationSec());

    if (s.maxCombo > 0) {
      useStatsStore.getState().updateHighestCombo(s.maxCombo);
    }
    if (duration > 0 || s.correctCount > 0 || s.wrongCount > 0) {
      useStatsStore.getState().recordSession(duration, s.correctCount, s.wrongCount, s.practiceConfig.mode);
    }
    if (s.wrongDetails.length > 0) {
      useStatsStore.getState().addWrongWords(
        s.wrongDetails.map(w => ({ text: w.text, count: w.count, mode: s.practiceConfig.mode }))
      );
    }
    setLastPracticeConfig(s.practiceConfig);

    set({
      status: s.lives <= 0 ? 'gameover' : 'idle',
      fallingItems: [],
      endTime,
      sessionDuration: duration,
    });
  },

  setDifficulty: (d: Difficulty) => {
    if (get().status === 'playing' || get().status === 'paused') return;
    set({ difficulty: d });
  },

  setPracticeConfig: (cfg: PracticeConfig) => {
    if (get().status === 'playing' || get().status === 'paused') return;
    set({ practiceConfig: cfg });
    setLastPracticeConfig(cfg);
  },

  setPracticeMode: (mode: PracticeMode, customChars: string[] = []) => {
    if (get().status === 'playing' || get().status === 'paused') return;
    const cfg: PracticeConfig = {
      mode,
      customChars,
      label: getModeLabel(mode),
    };
    set({ practiceConfig: cfg });
    setLastPracticeConfig(cfg);
  },

  spawnItem: (areaWidth: number) => {
    const s = get();
    if (s.status !== 'playing') return;
    const cfg = DIFFICULTY_CONFIG[s.difficulty];

    const wordStore = useWordStore.getState();
    const statsStore = useStatsStore.getState();
    const words = pickWordsForPractice(
      s.practiceConfig,
      s.practiceConfig.mode === 'digitRow' ? 'digits' : s.difficulty,
      wordStore.library,
      statsStore.wrongRecords
    );

    if (words.length === 0) return;
    const word = words[Math.floor(Math.random() * words.length)];

    const minX = GAME_CONFIG.SPAWN_X_MIN;
    const maxX = Math.max(minX + 1, GAME_CONFIG.SPAWN_X_MAX);
    const xPct = minX + Math.random() * (maxX - minX);

    const speedMultiplier = s.practiceConfig.mode === 'digitRow' ? 1 : 1;
    const item: FallingItem = {
      id: uid('fi'),
      text: word,
      typed: '',
      x: xPct,
      y: -5,
      speed: cfg.baseSpeed * (0.9 + Math.random() * 0.3) * speedMultiplier,
      createdAt: performance.now(),
    };
    set({ fallingItems: [...s.fallingItems, item] });
  },

  updateItems: (deltaMs: number, areaHeight: number) => {
    const s = get();
    if (s.status !== 'playing') return;
    const bottomY = GAME_CONFIG.GAME_AREA_BOTTOM_PERCENT;
    const speedMultiplier = deltaMs / 16.67;

    const missedItems: FallingItem[] = [];
    const surviving: FallingItem[] = [];

    for (const item of s.fallingItems) {
      const newY = item.y + item.speed * speedMultiplier;
      if (newY >= bottomY) {
        missedItems.push(item);
      } else {
        surviving.push({ ...item, y: newY });
      }
    }

    if (missedItems.length > 0) {
      const newWrongDetails = recordWrongWords(s.wrongDetails, missedItems.map(i => i.text));
      const newLives = Math.max(0, s.lives - missedItems.length);
      const endNow = newLives <= 0;

      set({
        fallingItems: surviving,
        lives: newLives,
        combo: 0,
        wrongCount: s.wrongCount + missedItems.length,
        wrongDetails: newWrongDetails,
        screenFlash: { type: 'error', time: performance.now() },
        status: endNow ? 'gameover' : s.status,
      });
      if (endNow) {
        get().endGame();
      }
    } else {
      set({ fallingItems: surviving });
    }
  },

  processKey: (key: string, _areaHeightPx?: number) => {
    const s = get();
    if (s.status !== 'playing') return { handled: false, correct: false };
    if (key.length !== 1) return { handled: false, correct: false };

    const sorted = [...s.fallingItems].sort((a, b) => b.y - a.y);
    const target = sorted[0];
    if (!target) return { handled: false, correct: false };

    const nextChar = target.text[target.typed.length];
    if (!nextChar) return { handled: false, correct: false };

    const matchesCaseSensitive = key === nextChar;
    const matchesCaseInsensitive = key.toLowerCase() === nextChar.toLowerCase();

    if (!matchesCaseSensitive && !matchesCaseInsensitive) {
      const newWrongDetails = recordWrongWords(s.wrongDetails, [target.text]);
      const newLives = Math.max(0, s.lives - 1);
      const endNow = newLives <= 0;
      set({
        lives: newLives,
        combo: 0,
        wrongCount: s.wrongCount + 1,
        wrongDetails: newWrongDetails,
        screenFlash: { type: 'error', time: performance.now() },
        status: endNow ? 'gameover' : s.status,
      });
      if (endNow) {
        get().endGame();
      }
      return { handled: true, correct: false };
    }

    const newTyped = target.typed + (matchesCaseSensitive ? key : nextChar);
    const isWordComplete = newTyped.length >= target.text.length;
    const baseScore = GAME_CONFIG.SCORE_PER_CHAR;
    const newCombo = s.combo + 1;
    const comboBonusLevels = Math.floor(newCombo / GAME_CONFIG.COMBO_BONUS_EVERY);
    const comboMultiplier = 1 + comboBonusLevels * GAME_CONFIG.COMBO_BONUS_PERCENT;
    let scoreGain = Math.round(baseScore * comboMultiplier);
    if (isWordComplete) {
      scoreGain += target.text.length * GAME_CONFIG.SCORE_PER_WORD_MULTIPLIER;
    }

    const newMaxCombo = Math.max(s.maxCombo, newCombo);
    const reachedMilestone = GAME_CONFIG.MILESTONE_COMBOS.includes(newCombo) &&
      !GAME_CONFIG.MILESTONE_COMBOS.includes(s.combo);

    const floatScore: FloatingScore = {
      id: `fs_${Date.now().toString(36)}_${(++floatIdCounter).toString(36)}`,
      x: target.x,
      y: target.y,
      value: scoreGain,
      createdAt: performance.now(),
    };

    const remaining = s.fallingItems
      .filter(i => i.id !== target.id)
      .concat(isWordComplete ? [] : [{ ...target, typed: newTyped }]);

    set({
      fallingItems: remaining,
      score: s.score + scoreGain,
      combo: newCombo,
      maxCombo: newMaxCombo,
      correctCount: s.correctCount + 1,
      floatingScores: [...s.floatingScores, floatScore],
      screenFlash: reachedMilestone
        ? { type: 'milestone', time: performance.now() }
        : s.screenFlash,
    });

    if (newMaxCombo > useStatsStore.getState().highestCombo) {
      useStatsStore.getState().updateHighestCombo(newMaxCombo);
    }

    return { handled: true, correct: true };
  },

  setActiveKey: (k: string | null) => {
    set({ activeKey: k });
  },

  cleanupFloatingScores: (now: number) => {
    const s = get();
    if (s.floatingScores.length === 0) return;
    const filtered = s.floatingScores.filter(
      f => now - f.createdAt < GAME_CONFIG.FLOATING_SCORE_DURATION
    );
    if (filtered.length !== s.floatingScores.length) {
      set({ floatingScores: filtered });
    }
  },

  clearScreenFlash: () => {
    const s = get();
    if (s.screenFlash.type === null) return;
    const now = performance.now();
    if (now - s.screenFlash.time > 400) {
      set({ screenFlash: { type: null, time: 0 } });
    }
  },

  getElapsedSeconds: (): number => {
    return get().getSessionDurationSec();
  },

  getSessionDurationSec: (): number => {
    const s = get();
    if (s.startTime == null) return 0;
    if (s.sessionDuration > 0 && (s.status === 'gameover' || s.status === 'idle')) {
      return s.sessionDuration;
    }
    const endTime = s.status === 'paused' ? s.pausedTime : performance.now();
    return Math.max(0, Math.floor((endTime - s.startTime - s.totalPausedTime) / 1000));
  },
}));

function recordWrongWords(existing: WrongRecordLocal[], words: string[]): WrongRecordLocal[] {
  const map = new Map<string, number>();
  for (const r of existing) map.set(r.text, r.count);
  for (const w of words) map.set(w, (map.get(w) ?? 0) + 1);
  return Array.from(map.entries()).map(([text, count]) => ({ text, count }));
}

function getModeLabel(mode: PracticeMode): string {
  const map: Record<PracticeMode, string> = {
    all: '全键练习',
    leftHand: '左手区',
    rightHand: '右手区',
    homeRow: '基准键位',
    topRow: '上行键位',
    bottomRow: '下行键位',
    digitRow: '数字行',
    custom: '自定义',
    wrongWords: '错题专项',
  };
  return map[mode] ?? mode;
}
