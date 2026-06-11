import { useGameStore } from '@/stores/useGameStore';
import { DIFFICULTY_CONFIG, getPracticeModeLabel } from '@/utils/constants';
import type { Difficulty } from '@/types';
import {
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  BarChart3,
  Settings2,
} from 'lucide-react';

interface Props {
  onOpenWordEditor: () => void;
  onOpenStats: () => void;
  onOpenPracticeConfig: () => void;
}

export function ControlPanel({ onOpenWordEditor, onOpenStats, onOpenPracticeConfig }: Props) {
  const status = useGameStore(s => s.status);
  const difficulty = useGameStore(s => s.difficulty);
  const practiceMode = useGameStore(s => s.practiceConfig.mode);
  const startGame = useGameStore(s => s.startGame);
  const pauseGame = useGameStore(s => s.pauseGame);
  const resumeGame = useGameStore(s => s.resumeGame);
  const restartGame = useGameStore(s => s.restartGame);
  const setDifficulty = useGameStore(s => s.setDifficulty);

  const isRunning = status === 'playing';
  const canChangeDifficulty = status === 'idle' || status === 'gameover';

  const togglePlay = () => {
    if (status === 'playing') pauseGame();
    else if (status === 'paused') resumeGame();
    else startGame();
  };

  return (
    <div className="w-full px-6 py-3 flex flex-wrap items-center justify-center gap-3 z-10 relative">
      <div className="flex items-center gap-2 bg-slate-800/60 rounded-full p-1 border border-slate-700/50">
        {(['easy', 'normal', 'hard'] as Difficulty[]).map(d => {
          const cfg = DIFFICULTY_CONFIG[d];
          const active = d === difficulty;
          return (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              disabled={!canChangeDifficulty}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                active
                  ? `${cfg.color.split(' ')[1]} bg-slate-700/80`
                  : 'text-slate-400 hover:text-slate-200 disabled:opacity-40'
              } ${canChangeDifficulty ? 'hover:bg-slate-700/50' : 'cursor-not-allowed'}`}
            >
              {cfg.label}
            </button>
          );
        })}
      </div>

      <button
        onClick={onOpenPracticeConfig}
        className="btn-cyan flex items-center gap-2"
        title={`练习模式：${getPracticeModeLabel(practiceMode)}`}
      >
        <Settings2 size={18} />
        <span className="hidden sm:inline">{getPracticeModeLabel(practiceMode)}</span>
        <span className="sm:hidden">模式</span>
      </button>

      <div className="w-px h-8 bg-slate-700/60 mx-1" />

      <div className="flex items-center gap-2">
        <button
          onClick={togglePlay}
          className="btn-green flex items-center gap-2"
          title={isRunning ? '暂停 (ESC)' : '开始 (空格)'}
        >
          {isRunning ? (
            <>
              <Pause size={18} />
              <span>暂停</span>
            </>
          ) : status === 'paused' ? (
            <>
              <Play size={18} />
              <span>继续</span>
            </>
          ) : (
            <>
              <Play size={18} />
              <span>开始</span>
            </>
          )}
        </button>

        <button
          onClick={restartGame}
          className="btn-cyan flex items-center gap-2"
          title="重新开始"
        >
          <RotateCcw size={18} />
          <span>重开</span>
        </button>
      </div>

      <div className="w-px h-8 bg-slate-700/60 mx-1" />

      <button
        onClick={onOpenWordEditor}
        className="btn-purple flex items-center gap-2"
        title="词库编辑器"
      >
        <BookOpen size={18} />
        <span>词库</span>
      </button>

      <button
        onClick={onOpenStats}
        className="btn-pink flex items-center gap-2"
        title="统计面板"
      >
        <BarChart3 size={18} />
        <span>统计</span>
      </button>

      <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-slate-800/40 px-3 py-1.5 rounded-full border border-slate-700/40">
        <span>空格开始 · ESC暂停</span>
      </div>
    </div>
  );
}
