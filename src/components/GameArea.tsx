import { useRef } from 'react';
import { useGameStore } from '@/stores/useGameStore';
import { GAME_CONFIG, getPracticeModeLabel } from '@/utils/constants';
import { useGameLoop } from '@/hooks/useGameLoop';
import { useKeyboard } from '@/hooks/useKeyboard';
import { FallingItem } from './FallingItem';
import { Trophy, Target, Clock, Flame, AlertTriangle, Check, X, Target as GoalIcon } from 'lucide-react';
import type { GoalType } from '@/types';

export function GameArea() {
  const areaRef = useRef<HTMLDivElement>(null);
  useGameLoop(areaRef);
  useKeyboard(areaRef);

  const items = useGameStore(s => s.fallingItems);
  const floatingScores = useGameStore(s => s.floatingScores);
  const screenFlash = useGameStore(s => s.screenFlash);
  const status = useGameStore(s => s.status);
  const combo = useGameStore(s => s.combo);

  const sortedByY = [...items].sort((a, b) => b.y - a.y);
  const activeId = sortedByY[0]?.id ?? null;

  const milestoneLabels: Record<number, string> = {
    10: '十连击！',
    25: '二十五连击！',
    50: '超级连击！',
    100: '完美表现！',
    200: '传奇！',
  };

  return (
    <div
      ref={areaRef}
      className="relative flex-1 w-full overflow-hidden game-grid-bg"
      style={{ minHeight: 0 }}
    >
      <div
        className="absolute left-0 right-0 h-1 bg-neon-red/30"
        style={{
          top: `${GAME_CONFIG.GAME_AREA_BOTTOM_PERCENT}%`,
          boxShadow: '0 0 12px rgba(248, 113, 113, 0.4)',
        }}
      />
      <div
        className="absolute left-4 text-xs text-neon-red/50 font-mono"
        style={{ top: `calc(${GAME_CONFIG.GAME_AREA_BOTTOM_PERCENT}% - 18px)` }}
      >
        ── 警戒线 ──
      </div>

      {items.map(item => (
        <FallingItem
          key={item.id}
          item={item}
          isActive={item.id === activeId}
        />
      ))}

      {floatingScores.map(fs => (
        <div
          key={fs.id}
          className="absolute font-mono font-bold text-neon-yellow pointer-events-none animate-float-up"
          style={{
            left: `${fs.x}%`,
            top: `${fs.y}%`,
            transform: 'translate(-50%, -50%)',
            textShadow: '0 0 10px #facc15, 0 0 20px #facc15',
            fontSize: '18px',
          }}
        >
          +{fs.value}
        </div>
      ))}

      {screenFlash.type === 'error' && (
        <div
          key={screenFlash.time}
          className="absolute inset-0 bg-neon-red/20 pointer-events-none animate-flash"
        />
      )}
      {screenFlash.type === 'milestone' && (
        <div
          key={screenFlash.time}
          className="absolute inset-0 bg-neon-cyan/30 pointer-events-none animate-flash flex items-center justify-center"
        >
          <div className="text-6xl font-black font-display text-white animate-bounce falling-text-glow">
            🔥 {milestoneLabels[combo] ?? `${combo} COMBO!`} 🔥
          </div>
        </div>
      )}

      {status === 'idle' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-bg-darker/60 backdrop-blur-sm">
          <h1 className="font-display text-6xl md:text-7xl font-black mb-4 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">
            ⌨️ TYPING RUSH
          </h1>
          <p className="text-slate-300 text-lg mb-2">键盘指法练习 · 挑战你的极限</p>
          <p className="text-slate-500 text-sm mb-8">
            按 <kbd className="px-2 py-0.5 bg-slate-800 rounded border border-slate-600 text-neon-cyan font-mono">空格</kbd> 或点击下方按钮开始
          </p>
          <div className="text-slate-400 text-sm max-w-md text-center">
            <p>🎯 敲对字母/单词得分 · ❌ 敲错或超时扣血</p>
            <p className="mt-1">🔥 保持连击获得额外加成 · ⚙️ 可切换练习模式</p>
          </div>
        </div>
      )}

      {status === 'paused' && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-bg-darker/70 backdrop-blur-sm">
          <div className="text-center">
            <div className="font-display text-7xl font-black text-neon-yellow mb-4 animate-pulse">
              ⏸ 暂停
            </div>
            <p className="text-slate-300">
              按 <kbd className="px-2 py-0.5 bg-slate-800 rounded border border-slate-600 text-neon-cyan font-mono">ESC</kbd> 继续
            </p>
          </div>
        </div>
      )}

      {status === 'gameover' && (
        <GameOverOverlay />
      )}
    </div>
  );
}

function GameOverOverlay() {
  const score = useGameStore(s => s.score);
  const maxCombo = useGameStore(s => s.maxCombo);
  const correct = useGameStore(s => s.correctCount);
  const wrong = useGameStore(s => s.wrongCount);
  const lives = useGameStore(s => s.lives);
  const durationSec = useGameStore(s => s.getSessionDurationSec());
  const wrongDetails = useGameStore(s => s.wrongDetails);
  const practiceMode = useGameStore(s => s.practiceConfig.mode);
  const wrongReview = useGameStore(s => s.wrongReviewSummary);
  const goalResult = useGameStore(s => s.goalResult);
  const practiceGoal = useGameStore(s => s.practiceConfig.goal);
  const restart = useGameStore(s => s.restartGame);

  const total = correct + wrong;
  const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
  const mins = Math.floor(durationSec / 60);
  const secs = durationSec % 60;
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

  const topWrong = [...wrongDetails].sort((a, b) => b.count - a.count).slice(0, 6);

  const goalLabel: Record<GoalType, string> = {
    duration: '练习时长',
    correctCount: '命中次数',
    accuracy: '正确率',
  };
  const goalUnit: Record<GoalType, string> = {
    duration: '秒',
    correctCount: '次',
    accuracy: '%',
  };

  const isWrongReviewMode = practiceMode === 'wrongWords' && wrongReview;
  const isGoalReached = goalResult?.reached;
  const endedByLives = lives <= 0;
  const endedByGoal = goalResult != null && isGoalReached;

  const titleText = endedByGoal ? '🎯 目标达成！' : '💥 游戏结束';
  const subtitleText = endedByGoal
    ? `${getPracticeModeLabel(practiceMode)} · 目标挑战完成`
    : `${getPracticeModeLabel(practiceMode)} · 生命耗尽`;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20 bg-bg-darker/80 backdrop-blur-sm overflow-auto scrollbar-thin">
      <div className="bg-slate-900/95 border-2 border-neon-purple rounded-3xl p-8 max-w-lg w-full mx-4 my-6 shadow-neon-purple">
        <div className="text-center mb-6">
          <div className={`font-display text-4xl font-black mb-1 ${
            endedByGoal
              ? 'bg-gradient-to-r from-neon-green to-neon-cyan bg-clip-text text-transparent'
              : 'bg-gradient-to-r from-neon-red to-neon-pink bg-clip-text text-transparent'
          }`}>
            {titleText}
          </div>
          <p className="text-slate-400 text-sm">{subtitleText}</p>
        </div>

        {goalResult && (
          <div className={`mb-5 rounded-xl p-4 border ${
            goalResult.reached
              ? 'bg-neon-green/10 border-neon-green/40'
              : 'bg-neon-yellow/10 border-neon-yellow/40'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <GoalIcon size={18} className={goalResult.reached ? 'text-neon-green' : 'text-neon-yellow'} />
              <span className={`text-sm font-bold ${goalResult.reached ? 'text-neon-green' : 'text-neon-yellow'}`}>
                {goalResult.reached ? '🎯 目标达成！' : '⏳ 未达成目标'}
              </span>
            </div>
            <div className="text-xs text-slate-300 flex items-center gap-3 flex-wrap">
              <span>{goalLabel[goalResult.type]}</span>
              <span className="font-mono">
                <span className={goalResult.reached ? 'text-neon-green' : 'text-neon-yellow'}>
                  {goalResult.actual}{goalUnit[goalResult.type]}
                </span>
                <span className="text-slate-500"> / 目标 {goalResult.target}{goalUnit[goalResult.type]}</span>
              </span>
            </div>
            <div className="mt-2">
              {goalResult.reached ? (
                <span className="text-xs text-neon-green/80">
                  ✓ 超出目标 <span className="font-mono">{goalResult.actual - goalResult.target}</span> {goalUnit[goalResult.type]}
                </span>
              ) : (
                <span className="text-xs text-neon-yellow/80">
                  还差 <span className="font-mono">{goalResult.target - goalResult.actual}</span> {goalUnit[goalResult.type]}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-800/60 rounded-xl p-4 border border-neon-yellow/30">
            <div className="flex items-center gap-2 text-xs text-neon-yellow/70 mb-1">
              <Trophy size={14} />
              <span>最终分数</span>
            </div>
            <div className="text-2xl font-bold text-neon-yellow font-mono">
              {score.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-4 border border-neon-green/30">
            <div className="flex items-center gap-2 text-xs text-neon-green/70 mb-1">
              <Flame size={14} />
              <span>最高连击</span>
            </div>
            <div className="text-2xl font-bold text-neon-green font-mono">
              {maxCombo}
            </div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-4 border border-neon-cyan/30">
            <div className="flex items-center gap-2 text-xs text-neon-cyan/70 mb-1">
              <Target size={14} />
              <span>正确率</span>
            </div>
            <div className="text-xl font-bold text-neon-cyan font-mono">
              {acc}%
              <span className="text-xs text-slate-500 ml-2">
                ({correct}/{total})
              </span>
            </div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-4 border border-neon-purple/30">
            <div className="flex items-center gap-2 text-xs text-neon-purple/70 mb-1">
              <Clock size={14} />
              <span>本局用时</span>
            </div>
            <div className="text-xl font-bold text-neon-purple font-mono">
              {timeStr}
            </div>
          </div>
        </div>

        {isWrongReviewMode && (
          <div className="bg-slate-800/40 border border-neon-pink/30 rounded-xl p-4 mb-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-neon-pink">
              📝 专项复习小结
              <span className="text-xs text-slate-500 font-normal ml-auto">
                共 {wrongReview.reviewed.length} 个
              </span>
            </div>
            {wrongReview.mastered.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-xs text-neon-green mb-1.5">
                  <Check size={12} /> <span>已掌握 ({wrongReview.mastered.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {wrongReview.mastered.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-neon-green/15 border border-neon-green/30 text-neon-green text-xs font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {wrongReview.stillWrong.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-xs text-neon-red mb-1.5">
                  <X size={12} /> <span>仍需加强 ({wrongReview.stillWrong.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {wrongReview.stillWrong.map((w, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-neon-red/15 border border-neon-red/30 text-neon-red text-xs font-mono">
                      {w.text} <span className="opacity-60">×{w.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            {wrongReview.notReached.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-xs text-slate-400 mb-1.5">
                  <span>⏳ 未练到 ({wrongReview.notReached.length})</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {wrongReview.notReached.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-slate-700/40 border border-slate-600/40 text-slate-400 text-xs font-mono">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!isWrongReviewMode && topWrong.length > 0 && (
          <div className="bg-slate-800/40 border border-neon-red/30 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-neon-red/90 mb-3">
              <AlertTriangle size={16} />
              <span>本局常错内容</span>
              <span className="text-xs text-slate-500 font-normal ml-auto">
                共 {wrongDetails.length} 种
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {topWrong.map((w, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 bg-neon-red/10 border border-neon-red/30 rounded-lg px-2.5 py-1"
                >
                  <span className="font-mono text-sm text-neon-red/90">{w.text}</span>
                  <span className="text-xs text-neon-red/60">×{w.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {practiceGoal && (
          <p className="text-xs text-slate-500 text-center mb-3">
            💡 点击「再来一局」将沿用当前目标配置
          </p>
        )}
        <button onClick={restart} className="btn-purple w-full text-lg">
          🔄 再来一局
        </button>
      </div>
    </div>
  );
}
