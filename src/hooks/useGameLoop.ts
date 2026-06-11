import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/useGameStore';
import { DIFFICULTY_CONFIG } from '@/utils/constants';

export function useGameLoop(areaRef: React.RefObject<HTMLDivElement>) {
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);

  useEffect(() => {
    const tick = (now: number) => {
      const state = useGameStore.getState();
      const area = areaRef.current;

      if (state.status === 'playing' && area) {
        const delta = Math.min(100, now - (lastFrameRef.current || now));
        lastFrameRef.current = now;

        state.updateItems(delta, area.clientHeight);
        state.cleanupFloatingScores(now);

        const cfg = DIFFICULTY_CONFIG[state.difficulty];
        if (!lastSpawnRef.current) lastSpawnRef.current = now;
        if (now - lastSpawnRef.current >= cfg.spawnInterval) {
          state.spawnItem(area.clientWidth);
          lastSpawnRef.current = now;
        }
      } else {
        lastFrameRef.current = now;
      }

      useGameStore.getState().clearScreenFlash();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [areaRef]);

  useEffect(() => {
    const status = useGameStore.getState().status;
    if (status === 'idle' || status === 'gameover') {
      lastSpawnRef.current = 0;
      lastFrameRef.current = 0;
    }
  }, [useGameStore(s => s.status)]);
}
