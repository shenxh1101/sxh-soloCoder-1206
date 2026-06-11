export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type DifficultyWordPool = Difficulty;

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
}

export interface DailyStats {
  date: string;
  totalDuration: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  sessions: number;
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

export interface FloatingScore {
  id: string;
  x: number;
  y: number;
  value: number;
  createdAt: number;
}
