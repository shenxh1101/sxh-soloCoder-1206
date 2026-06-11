import type { DifficultyConfig, PracticeConfig, WrongRecord } from '@/types';
import { DEFAULT_WORD_LIBRARY } from './defaultWords';

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
  digits: {
    spawnInterval: 1500,
    baseSpeed: 1.0,
    wordPool: 'digits',
    label: '数字',
    color: 'text-neon-yellow border-neon-yellow',
  },
};

export const DEFAULT_PRACTICE_CONFIG: PracticeConfig = {
  mode: 'all',
  customChars: [],
  label: '全键练习',
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
  MAX_WRONG_RECORDS: 200,
};

export const STORAGE_KEYS = {
  WORD_LIBRARY: 'typing_game_word_library',
  DAILY_STATS: 'typing_game_daily_stats',
  HIGHEST_COMBO: 'typing_game_highest_combo',
  WRONG_RECORDS: 'typing_game_wrong_records',
  LAST_PRACTICE_CONFIG: 'typing_game_last_config',
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

export function getPracticeModeLabel(mode: string): string {
  const map: Record<string, string> = {
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

export function pickWordsForPractice(
  config: PracticeConfig,
  difficulty: string,
  library: typeof DEFAULT_WORD_LIBRARY,
  wrongRecords: WrongRecord[] = []
): string[] {
  const basePool = getBaseWordPool(difficulty, library);

  switch (config.mode) {
    case 'all':
      return basePool;
    case 'digitRow':
      return library.digits;
    case 'leftHand':
      return filterWordsByChars(basePool, 'left');
    case 'rightHand':
      return filterWordsByChars(basePool, 'right');
    case 'homeRow':
      return filterWordsByChars(basePool, 'home');
    case 'topRow':
      return filterWordsByChars(basePool, 'top');
    case 'bottomRow':
      return filterWordsByChars(basePool, 'bottom');
    case 'custom':
      if (config.customChars.length === 0) return basePool;
      return filterWordsByCustomSet(basePool, config.customChars);
    case 'wrongWords': {
      if (wrongRecords.length === 0) return basePool;
      const texts = [...new Set(wrongRecords.slice(0, 50).map(r => r.text))];
      return texts.length > 0 ? texts : basePool;
    }
    default:
      return basePool;
  }
}

function getBaseWordPool(difficulty: string, library: typeof DEFAULT_WORD_LIBRARY): string[] {
  switch (difficulty) {
    case 'easy':
      return library.easy;
    case 'hard':
      return library.hard;
    case 'digits':
      return library.digits;
    case 'normal':
    default:
      return library.normal;
  }
}

const LEFT_CHARS = new Set('qwertasdfgzxcvbQWERTASDFGZXCVB'.split(''));
const RIGHT_CHARS = new Set('yuiophjklnm,YUIOPHJKLNM,'.split(''));
const HOME_CHARS = new Set('asdfjkl;ASDFJKL;'.split(''));
const TOP_CHARS = new Set('qwertyuiopQWERTYUIOP'.split(''));
const BOTTOM_CHARS = new Set('zxcvbnm,./ZXCVBNM<>?'.split(''));

function filterWordsByChars(words: string[], region: string): string[] {
  const charSet = region === 'left' ? LEFT_CHARS
    : region === 'right' ? RIGHT_CHARS
    : region === 'home' ? HOME_CHARS
    : region === 'top' ? TOP_CHARS
    : BOTTOM_CHARS;

  const singleChars: string[] = [];
  const fullWords: string[] = [];

  for (const w of words) {
    if (w.length === 1 && charSet.has(w)) {
      singleChars.push(w);
    }
    if (w.length > 1) {
      let allMatch = true;
      for (const ch of w) {
        if (!charSet.has(ch)) { allMatch = false; break; }
      }
      if (allMatch) fullWords.push(w);
    }
  }

  const result = [...singleChars, ...fullWords];
  return result.length > 0 ? result : singleChars;
}

function filterWordsByCustomSet(words: string[], customChars: string[]): string[] {
  const charSet = new Set(customChars);
  const lowerSet = new Set(customChars.map(c => c.toLowerCase()));
  const upperSet = new Set(customChars.map(c => c.toUpperCase()));

  const singleChars: string[] = [];
  const fullWords: string[] = [];

  for (const w of words) {
    if (w.length === 1 && (charSet.has(w) || lowerSet.has(w) || upperSet.has(w))) {
      singleChars.push(w);
    }
    if (w.length > 1) {
      let allMatch = true;
      for (const ch of w) {
        const lower = ch.toLowerCase();
        if (!lowerSet.has(lower)) { allMatch = false; break; }
      }
      if (allMatch) fullWords.push(w);
    }
  }

  const result = [...singleChars, ...fullWords];
  return result.length > 0 ? result : customChars;
}
