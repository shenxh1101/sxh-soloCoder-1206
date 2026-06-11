export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type DifficultyWordPool = Difficulty | 'digits';

export type PracticeMode =
  | 'all'
  | 'leftHand'
  | 'rightHand'
  | 'homeRow'
  | 'digitRow'
  | 'topRow'
  | 'bottomRow'
  | 'custom'
  | 'wrongWords';

export type WrongSort = 'count' | 'recent' | 'mode';

export interface PracticeConfig {
  mode: PracticeMode;
  customChars: string[];
  label: string;
  wrongSort?: WrongSort;
  wrongLimit?: number;
  goal?: PracticeGoal | null;
}

export type GoalType = 'duration' | 'correctCount' | 'accuracy';

export interface PracticeGoal {
  type: GoalType;
  value: number;
}

export interface GoalResult {
  reached: boolean;
  type: GoalType;
  target: number;
  actual: number;
}

export interface WrongReviewSummary {
  reviewed: string[];
  mastered: string[];
  stillWrong: { text: string; count: number }[];
}

export interface FallingItem {
  id: string;
  text: string;
  typed: string;
  x: number;
  y: number;
  speed: number;
  createdAt: number;
}

export interface WordLibrary {
  easy: string[];
  normal: string[];
  hard: string[];
  digits: string[];
}

export interface DailyStats {
  date: string;
  totalDuration: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  sessions: number;
  byMode: Record<string, ModeStats>;
}

export interface ModeStats {
  duration: number;
  correctCount: number;
  wrongCount: number;
  sessions: number;
}

export interface WrongRecord {
  text: string;
  count: number;
  lastSeen: number;
  mode: string;
}

export interface DifficultyConfig {
  spawnInterval: number;
  baseSpeed: number;
  wordPool: DifficultyWordPool;
  label: string;
  color: string;
}

export interface GameStateData {
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
  wrongDetails: WrongRecord[];
  fallingItems: FallingItem[];
  activeKey: string | null;
  floatingScores: FloatingScore[];
  screenFlash: { type: 'milestone' | 'error' | null; time: number };
}

export interface FloatingScore {
  id: string;
  x: number;
  y: number;
  value: number;
  createdAt: number;
}

export const PRACTICE_MODES: { key: PracticeMode; label: string; icon: string; desc: string }[] = [
  { key: 'all', label: '全键练习', icon: '⌨️', desc: '混合掉落字母和单词' },
  { key: 'leftHand', label: '左手区', icon: '👈', desc: '只出现左手键位字母' },
  { key: 'rightHand', label: '右手区', icon: '👉', desc: '只出现右手键位字母' },
  { key: 'homeRow', label: '基准键位', icon: '🏠', desc: 'ASDF JKL;  home row' },
  { key: 'topRow', label: '上行键位', icon: '⬆️', desc: 'QWERTYUIOP 行' },
  { key: 'bottomRow', label: '下行键位', icon: '⬇️', desc: 'ZXCVBNM 行' },
  { key: 'digitRow', label: '数字行', icon: '🔢', desc: '1234567890 数字练习' },
  { key: 'custom', label: '自定义', icon: '✏️', desc: '指定要练习的字符' },
  { key: 'wrongWords', label: '错题专项', icon: '📝', desc: '只练经常打错的内容' },
];

export const LEFT_HAND_CHARS = 'QWERTASDFGZXCVBqwertasdfgzxcvb'.split('');
export const RIGHT_HAND_CHARS = 'YUIOPHJKLNM,yuiophjklnm,'.split('');
export const HOME_ROW_CHARS = 'ASDFJKL;asdfjkl;'.split('');
export const TOP_ROW_CHARS = 'QWERTYUIOPqwertyuiop'.split('');
export const BOTTOM_ROW_CHARS = 'ZXCVBNM,.zxcvbnm,'.split('');
export const DIGIT_ROW_CHARS = '1234567890'.split('');
