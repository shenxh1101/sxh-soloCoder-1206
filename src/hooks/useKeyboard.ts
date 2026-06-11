import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/useGameStore';
import { GAME_CONFIG } from '@/utils/constants';

export function useKeyboard(areaRef: React.RefObject<HTMLDivElement>) {
  const activeTimerRef = useRef<number | null>(null);

  const normalizeKey = (code: string, key: string): string | null => {
    if (key === ' ') return 'Space';
    if (key === 'Backspace') return 'Backspace';
    if (key === 'Tab') return 'Tab';
    if (key === 'CapsLock') return 'Caps';
    if (key === 'Enter') return 'Enter';
    if (key === 'Shift') return 'Shift';
    if (key === 'Control') return 'Ctrl';
    if (key === 'Meta' || key === 'OS') return 'Win';
    if (key === 'Alt') return 'Alt';
    if (code && code.startsWith('Key')) {
      return code.slice(3);
    }
    if (code && code.startsWith('Digit')) {
      return code.slice(5);
    }
    if (key.length === 1) {
      return key;
    }
    return key;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useGameStore.getState();
      const area = areaRef.current;

      if (e.key === 'Escape') {
        e.preventDefault();
        if (state.status === 'playing') state.pauseGame();
        else if (state.status === 'paused') state.resumeGame();
        return;
      }

      if (e.key === ' ' && (state.status === 'idle' || state.status === 'gameover')) {
        e.preventDefault();
        state.startGame();
        return;
      }

      const displayKey = normalizeKey(e.code, e.key);
      if (displayKey) {
        if (activeTimerRef.current) {
          window.clearTimeout(activeTimerRef.current);
        }
        state.setActiveKey(displayKey);
        activeTimerRef.current = window.setTimeout(() => {
          useGameStore.getState().setActiveKey(null);
        }, GAME_CONFIG.ACTIVE_KEY_DURATION);
      }

      if (state.status === 'playing' && e.key.length === 1) {
        state.processKey(e.key, area?.clientHeight ?? 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (activeTimerRef.current) window.clearTimeout(activeTimerRef.current);
    };
  }, [areaRef]);
}
