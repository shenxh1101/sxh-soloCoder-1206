import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/useGameStore';
import { DIFFICULTY_CONFIG } from '@/utils/constants';

export function useGameLoop(areaRef: React.RefObject<HTMLDivElement>) {
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const lastSpawnRef = useRef<number>(0);
  const endedByGoalRef = useRef<boolean>(false);

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

        // Goal check: auto end when reached
        const goal = state.practiceConfig.goal;
        if (goal && !endedByGoalRef.current) {
          let reached = false;
          if (goal.type === 'duration') {
            reached = state.getSessionDurationSec() >= goal.value;
          } else if (goal.type === 'correctCount') {
            reached = state.correctCount >= goal.value;
          } else if (goal.type === 'accuracy') {
            const denom = state.correctCount + state.wrongCount;
            if (denom >= 10) {
              const acc = Math.round((state.correctCount / denom) * 100);
              reached = acc >= goal.value;
            }
          }
          if (reached) {
            endedByGoalRef.current = true;
            state.endGame();
          }
        }
      } else {
        lastFrameRef.current = now;
        if (state.status === 'idle') {
          endedByGoalRef.current = false;
        }
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
      endedByGoalRef.current = false;
    }
  }, [useGameStore(s => s.status)]);
}
