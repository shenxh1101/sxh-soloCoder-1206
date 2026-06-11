import type { DifficultyConfig } from '@/types';

export const DIFFICULTY_CONFIG: Record<string, DifficultyConfig> = {
  easy: {
    spawnInterval: 2200,
    baseSpeed: 0.7,
    wordPool: 'easy',
    label: '简单',
    color: 'text-neon-green border-neon-green',
  },
  normal: {
    spawnInterval: 1600,
    baseSpeed: 1.1,
    wordPool: 'normal',
    label: '普通',
    color: 'text-neon-cyan border-neon-cyan',
  },
  hard: {
    spawnInterval: 1100,
    baseSpeed: 1.7,
    wordPool: 'hard',
    label: '困难',
    color: 'text-neon-pink border-neon-pink',
  },
};

export const GAME_CONFIG = {
  MAX_LIVES: 5,
  SCORE_PER_CHAR: 10,
  SCORE_PER_WORD_MULTIPLIER: 20,
  COMBO_BONUS_EVERY: 5,
  COMBO_BONUS_PERCENT: 0.5,
  GAME_AREA_BOTTOM_PERCENT: 85,
  SPAWN_X_MIN: 5,
  SPAWN_X_MAX: 85,
  FLOATING_SCORE_DURATION: 800,
  MILESTONE_COMBOS: [10, 25, 50, 100, 200],
  ACTIVE_KEY_DURATION: 120,
};

export const STORAGE_KEYS = {
  WORD_LIBRARY: 'typing_game_word_library',
  DAILY_STATS: 'typing_game_daily_stats',
  HIGHEST_COMBO: 'typing_game_highest_combo',
};

export const KEYBOARD_LAYOUT: string[][] = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
  ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'Win', 'Ctrl'],
];

export const KEY_WIDTHS: Record<string, string> = {
  'Backspace': 'w-[92px]',
  'Tab': 'w-[68px]',
  '\\': 'w-[56px]',
  'Caps': 'w-[80px]',
  'Enter': 'w-[92px]',
  'Shift': 'w-[104px]',
  'Ctrl': 'w-[60px]',
  'Win': 'w-[52px]',
  'Alt': 'w-[56px]',
  'Space': 'flex-1',
};
