import { useGameStore } from '@/stores/useGameStore';
import { useStatsStore } from '@/stores/useStatsStore';
import { DIFFICULTY_CONFIG } from '@/utils/constants';
import {
  Trophy,
  Heart,
  Flame,
  Timer,
  Target,
  Zap,
} from 'lucide-react';

export function StatusBar() {
  const score = useGameStore(s => s.score);
  const lives = useGameStore(s => s.lives);
  const maxLives = useGameStore(s => s.maxLives);
  const difficulty = useGameStore(s => s.difficulty);
  const combo = useGameStore(s => s.combo);
  const maxCombo = useGameStore(s => s.maxCombo);
  const elapsed = useGameStore(s => s.getElapsedSeconds());
  const highestCombo = useStatsStore(s => s.highestCombo);

  const cfg = DIFFICULTY_CONFIG[difficulty];
  const accuracyDenom = useGameStore(s => s.correctCount + s.wrongCount);
  const accuracyNum = useGameStore(s => s.correctCount);
  const accuracy = accuracyDenom > 0 ? Math.round((accuracyNum / accuracyDenom) * 100) : 0;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const displayHighest = Math.max(highestCombo, maxCombo);

  return (
    <div className="w-full px-6 pt-4 flex flex-wrap items-center justify-center gap-3 z-10 relative">
      <div className="stat-card">
        <div className="flex items-center gap-2 text-neon-yellow/80 text-xs mb-1">
          <Trophy size={14} />
          <span>分数</span>
        </div>
        <div className="text-2xl font-bold font-mono text-neon-yellow">
          {score.toLocaleString()}
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-2 text-neon-red/80 text-xs mb-1">
          <Heart size={14} />
          <span>生命</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: maxLives }).map((_, i) => (
            <Heart
              key={i}
              size={18}
              className={`${
                i < lives
                  ? 'text-neon-red fill-neon-red/80 drop-shadow-[0_0_6px_rgba(248,113,113,0.7)]'
                  : 'text-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
          <Target size={14} />
          <span>难度</span>
        </div>
        <div className={`text-lg font-bold ${cfg.color.split(' ')[0]}`}>
          {cfg.label}
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-2 text-neon-green/80 text-xs mb-1">
          <Zap size={14} />
          <span>连击</span>
        </div>
        <div className="text-2xl font-bold font-mono text-neon-green">
          {combo}
          {combo >= 10 && (
            <Flame
              size={18}
              className="inline ml-1 text-neon-orange animate-pulse"
              style={{ color: '#f97316' }}
            />
          )}
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-2 text-neon-cyan/80 text-xs mb-1">
          <Flame size={14} />
          <span>最高连击</span>
        </div>
        <div className="text-2xl font-bold font-mono text-neon-cyan">
          {displayHighest}
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-2 text-neon-purple/80 text-xs mb-1">
          <Timer size={14} />
          <span>用时 / 正确率</span>
        </div>
        <div className="text-lg font-bold font-mono text-neon-purple">
          {timeStr} / {accuracy}%
        </div>
      </div>
    </div>
  );
}
