import { create } from 'zustand';
import { getWordLibrary, setWordLibrary, resetWordLibrary } from '@/utils/storage';
import { DEFAULT_WORD_LIBRARY } from '@/utils/defaultWords';
import type { WordLibrary, Difficulty } from '@/types';

interface WordState {
  library: WordLibrary;
  loadLibrary: () => void;
  saveLibrary: (lib: WordLibrary) => void;
  resetLibrary: () => void;
  getRandomWord: (difficulty: Difficulty) => string;
}

export const useWordStore = create<WordState>((set, get) => ({
  library: JSON.parse(JSON.stringify(DEFAULT_WORD_LIBRARY)),

  loadLibrary: () => {
    set({ library: getWordLibrary() });
  },

  saveLibrary: (lib: WordLibrary) => {
    setWordLibrary(lib);
    set({ library: lib });
  },

  resetLibrary: () => {
    const lib = resetWordLibrary();
    set({ library: lib });
  },

  getRandomWord: (difficulty: Difficulty): string => {
    const { library } = get();
    const pool = library[difficulty] ?? library.normal;
    if (pool.length === 0) return '?';
    return pool[Math.floor(Math.random() * pool.length)];
  },
}));
