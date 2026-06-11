import { create } from 'zustand';
import { GAME_CONFIG, DIFFICULTY_CONFIG } from '@/utils/constants';
import { useWordStore } from './useWordStore';
import { useStatsStore } from './useStatsStore';
import type { GameStatus, Difficulty, FallingItem, FloatingScore } from '@/types';

let itemIdCounter = 0;
let floatIdCounter = 0;

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${(++itemIdCounter).toString(36)}`;
}

interface GameActions {
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  restartGame: () => void;
  endGame: () => void;
  setDifficulty: (d: Difficulty) => void;
  spawnItem: (areaWidth: number) => void;
  updateItems: (deltaMs: number, areaHeight: number) => void;
  processKey: (key: string, areaHeightPx?: number) => { handled: boolean; correct: boolean };
  setActiveKey: (k: string | null) => void;
  cleanupFloatingScores: (now: number) => void;
  clearScreenFlash: () => void;
  getElapsedSeconds: () => number;
}

interface GameState extends GameActions {
  status: GameStatus;
  difficulty: Difficulty;
  score: number;
  lives: number;
  maxLives: number;
  combo: number;
  maxCombo: number;
  startTime: number | null;
  pausedTime: number;
  totalPausedTime: number;
  correctCount: number;
  wrongCount: number;
  fallingItems: FallingItem[];
  activeKey: string | null;
  floatingScores: FloatingScore[];
  screenFlash: { type: 'milestone' | 'error' | null; time: number };
}

const initialState = {
  status: 'idle' as GameStatus,
  difficulty: 'normal' as Difficulty,
  score: 0,
  lives: GAME_CONFIG.MAX_LIVES,
  maxLives: GAME_CONFIG.MAX_LIVES,
  combo: 0,
  maxCombo: 0,
  startTime: null as number | null,
  pausedTime: 0,
  totalPausedTime: 0,
  correctCount: 0,
  wrongCount: 0,
  fallingItems: [] as FallingItem[],
  activeKey: null as string | null,
  floatingScores: [] as FloatingScore[],
  screenFlash: { type: null as 'milestone' | 'error' | null, time: 0 },
};

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  startGame: () => {
    const stats = useStatsStore.getState();
    stats.refresh();
    const prevDifficulty = get().difficulty;
    set({
      ...initialState,
      difficulty: prevDifficulty,
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
    const duration = s.getElapsedSeconds();
    if (s.maxCombo > 0) {
      useStatsStore.getState().updateHighestCombo(s.maxCombo);
    }
    useStatsStore.getState().recordSession(duration, s.correctCount, s.wrongCount);
    set({
      status: s.lives <= 0 ? 'gameover' : 'idle',
      fallingItems: [],
      startTime: null,
    });
  },

  setDifficulty: (d: Difficulty) => {
    if (get().status === 'playing' || get().status === 'paused') return;
    set({ difficulty: d });
  },

  spawnItem: (areaWidth: number) => {
    const s = get();
    if (s.status !== 'playing') return;
    const cfg = DIFFICULTY_CONFIG[s.difficulty];
    const word = useWordStore.getState().getRandomWord(cfg.wordPool);
    const minX = GAME_CONFIG.SPAWN_X_MIN;
    const maxX = Math.max(minX + 1, GAME_CONFIG.SPAWN_X_MAX);
    const xPct = minX + Math.random() * (maxX - minX);
    const item: FallingItem = {
      id: uid('fi'),
      text: word,
      typed: '',
      x: xPct,
      y: -5,
      speed: cfg.baseSpeed * (0.9 + Math.random() * 0.3),
      createdAt: performance.now(),
    };
    set({ fallingItems: [...s.fallingItems, item] });
  },

  updateItems: (deltaMs: number, areaHeight: number) => {
    const s = get();
    if (s.status !== 'playing') return;
    const bottomY = GAME_CONFIG.GAME_AREA_BOTTOM_PERCENT;
    const speedMultiplier = deltaMs / 16.67;
    let lifeLost = 0;
    const surviving: FallingItem[] = [];
    for (const item of s.fallingItems) {
      const newY = item.y + item.speed * speedMultiplier;
      if (newY >= bottomY) {
        lifeLost += 1;
      } else {
        surviving.push({ ...item, y: newY });
      }
    }
    if (lifeLost > 0) {
      const newLives = Math.max(0, s.lives - lifeLost);
      const nextState: Partial<GameState> = {
        fallingItems: surviving,
        lives: newLives,
        combo: 0,
        wrongCount: s.wrongCount + lifeLost,
        screenFlash: { type: 'error', time: performance.now() },
      };
      if (newLives <= 0) {
        nextState.status = 'gameover';
      }
      set(nextState);
      if (newLives <= 0) {
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
      const newLives = Math.max(0, s.lives - 1);
      const endNow = newLives <= 0;
      set({
        lives: newLives,
        combo: 0,
        wrongCount: s.wrongCount + 1,
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
    const s = get();
    if (s.startTime == null) return 0;
    const endTime = s.status === 'paused' ? s.pausedTime : performance.now();
    return Math.max(0, Math.floor((endTime - s.startTime - s.totalPausedTime) / 1000));
  },
}));
