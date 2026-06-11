import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { LineChart } from './LineChart';
import { useStatsStore } from '@/stores/useStatsStore';
import { useGameStore } from '@/stores/useGameStore';
import { getPracticeModeLabel } from '@/utils/constants';
import {
  Clock,
  Target,
  Flame,
  Calendar,
  TrendingUp,
  Trophy,
  Activity,
  BookX,
  Play,
  Trash2,
  BarChart2,
  Layers,
} from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onStartPractice?: (mode: string) => void;
}

type Range = 7 | 30;
type ViewMode = 'duration' | 'accuracy' | 'both';
type TabMode = 'overview' | 'wrongWords' | 'byMode';

export function StatsPanel({ open, onClose, onStartPractice }: Props) {
  const [range, setRange] = useState<Range>(7);
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [tab, setTab] = useState<TabMode>('overview');
  const refresh = useStatsStore(s => s.refresh);
  const getLastDays = useStatsStore(s => s.getLastDays);
  const highestCombo = useStatsStore(s => s.highestCombo);
  const wrongRecords = useStatsStore(s => s.wrongRecords);
  const clearWrongRecords = useStatsStore(s => s.clearWrongRecords);

  const status = useGameStore(s => s.status);
  const setPracticeMode = useGameStore(s => s.setPracticeMode);

  if (open) refresh();

  const rawData = useMemo(() => getLastDays(range), [getLastDays, range, open]);

  const chartData = useMemo(() => rawData.map(d => {
    const md = d.date.slice(5);
    return {
      label: md,
      value: viewMode === 'accuracy' ? d.accuracy * 100 : d.totalDuration / 60,
      value2: viewMode === 'both' ? d.accuracy * 100 : undefined,
    };
  }), [rawData, viewMode]);

  const summary = useMemo(() => {
    const totalSecs = rawData.reduce((a, b) => a + b.totalDuration, 0);
    const totalCorrect = rawData.reduce((a, b) => a + b.correctCount, 0);
    const totalWrong = rawData.reduce((a, b) => a + b.wrongCount, 0);
    const totalSessions = rawData.reduce((a, b) => a + b.sessions, 0);
    const activeDays = rawData.filter(d => d.totalDuration > 0 || d.sessions > 0).length;
    const avgAccuracyDenom = totalCorrect + totalWrong;
    const avgAccuracy = avgAccuracyDenom > 0 ? totalCorrect / avgAccuracyDenom : 0;

    return {
      totalSeconds: totalSecs,
      totalMinutes: totalSecs / 60,
      totalCorrect,
      totalWrong,
      totalSessions,
      activeDays,
      avgAccuracy,
    };
  }, [rawData]);

  const topWrong = useMemo(
    () => [...wrongRecords].sort((a, b) => b.count - a.count).slice(0, 15),
    [wrongRecords]
  );

  const modeStats = useMemo(() => {
    const map = new Map<string, { duration: number; correct: number; wrong: number; sessions: number }>();
    for (const day of rawData) {
      if (!day.byMode) continue;
      for (const [modeKey, stats] of Object.entries(day.byMode)) {
        const existing = map.get(modeKey) ?? { duration: 0, correct: 0, wrong: 0, sessions: 0 };
        existing.duration += stats.duration;
        existing.correct += stats.correctCount;
        existing.wrong += stats.wrongCount;
        existing.sessions += stats.sessions;
        map.set(modeKey, existing);
      }
    }
    return Array.from(map.entries())
      .map(([mode, stats]) => ({
        mode,
        ...stats,
        accuracy: stats.correct + stats.wrong > 0 ? stats.correct / (stats.correct + stats.wrong) : 0,
      }))
      .sort((a, b) => b.duration - a.duration);
  }, [rawData]);

  const fmtDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60;
    if (h > 0) return `${h}h ${Math.round(m)}m`;
    return `${Math.round(m)} 分钟`;
  };

  const fmtDurationSec = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60;
    if (h > 0) return `${h}h ${Math.round(m)}m`;
    return `${Math.round(m)} 分钟`;
  };

  const handleStartWrongPractice = () => {
    if (wrongRecords.length === 0) return;
    const canStart = status === 'idle' || status === 'gameover';
    if (!canStart) {
      alert('请先结束当前游戏');
      return;
    }
    setPracticeMode('wrongWords', []);
    onClose();
    if (onStartPractice) onStartPractice('wrongWords');
  };

  const handleStartModePractice = (modeKey: string) => {
    const canStart = status === 'idle' || status === 'gameover';
    if (!canStart) {
      alert('请先结束当前游戏');
      return;
    }
    // 特殊模式直接设回 all
    setPracticeMode(modeKey as any, []);
    onClose();
    if (onStartPractice) onStartPractice(modeKey);
  };

  const handleClearWrong = () => {
    if (confirm('确定要清空所有错题记录吗？此操作不可恢复。')) {
      clearWrongRecords();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="📊 练习统计" accentColor="pink">
      <div className="p-6 space-y-5">
        <div className="flex gap-2 border-b border-slate-700/50">
          {([
            { k: 'overview', label: '总览', icon: TrendingUp },
            { k: 'byMode', label: '模式统计', icon: Layers },
            { k: 'wrongWords', label: '错题复盘', icon: BookX },
          ] as { k: TabMode; label: string; icon: any }[]).map(t => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-sm font-semibold transition-all -mb-px ${
                tab === t.k
                  ? 'border-neon-pink text-neon-pink'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <t.icon size={16} />
              {t.label}
              {t.k === 'wrongWords' && wrongRecords.length > 0 && (
                <span className="text-[10px] bg-neon-red/20 text-neon-red px-1.5 py-0.5 rounded-full">
                  {wrongRecords.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 bg-slate-800/50 rounded-full p-1 border border-slate-700/50">
                {([7, 30] as Range[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                      range === r
                        ? 'text-neon-pink bg-slate-700/80'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Calendar size={14} className="inline mr-1.5" />
                    最近 {r} 天
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-slate-800/50 rounded-full p-1 border border-slate-700/50">
                {([
                  { k: 'duration' as ViewMode, label: '时长', icon: Clock },
                  { k: 'accuracy' as ViewMode, label: '正确率', icon: Target },
                  { k: 'both' as ViewMode, label: '两者', icon: Activity },
                ]).map(t => (
                  <button
                    key={t.k}
                    onClick={() => setViewMode(t.k)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                      viewMode === t.k
                        ? 'text-neon-cyan bg-slate-700/80'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <t.icon size={14} />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="stat-card !min-w-0">
                <div className="flex items-center gap-1.5 text-neon-cyan/80 text-xs mb-1">
                  <Clock size={12} />
                  <span>总练习</span>
                </div>
                <div className="text-xl font-bold font-mono text-neon-cyan">
                  {fmtDuration(summary.totalSeconds)}
                </div>
              </div>
              <div className="stat-card !min-w-0">
                <div className="flex items-center gap-1.5 text-neon-green/80 text-xs mb-1">
                  <Target size={12} />
                  <span>平均正确率</span>
                </div>
                <div className="text-xl font-bold font-mono text-neon-green">
                  {Math.round(summary.avgAccuracy * 100)}%
                </div>
              </div>
              <div className="stat-card !min-w-0">
                <div className="flex items-center gap-1.5 text-neon-yellow/80 text-xs mb-1">
                  <Trophy size={12} />
                  <span>命中/失误</span>
                </div>
                <div className="text-xl font-bold font-mono text-neon-yellow">
                  {summary.totalCorrect} / {summary.totalWrong}
                </div>
              </div>
              <div className="stat-card !min-w-0">
                <div className="flex items-center gap-1.5 text-neon-purple/80 text-xs mb-1">
                  <Calendar size={12} />
                  <span>活跃</span>
                </div>
                <div className="text-xl font-bold font-mono text-neon-purple">
                  {summary.activeDays} 天
                </div>
              </div>
              <div className="stat-card !min-w-0 col-span-2 md:col-span-1">
                <div className="flex items-center gap-1.5 text-neon-pink/80 text-xs mb-1">
                  <Flame size={12} />
                  <span>最高连击</span>
                </div>
                <div className="text-xl font-bold font-mono text-neon-pink">
                  {highestCombo}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={18} className="text-neon-pink" />
                <h3 className="font-display font-bold text-lg text-slate-200">
                  {viewMode === 'duration' && '每日练习时长趋势（分钟）'}
                  {viewMode === 'accuracy' && '每日正确率趋势（%）'}
                  {viewMode === 'both' && '每日练习时长 & 正确率'}
                </h3>
              </div>
              {chartData.every(d => d.value === 0 && !d.value2) ? (
                <div className="text-center py-16 text-slate-500">
                  <Activity size={40} className="mx-auto mb-3 opacity-40" />
                  <p>暂无练习数据</p>
                  <p className="text-sm mt-1 opacity-70">完成一局练习后再来查看统计吧 🎯</p>
                </div>
              ) : (
                <LineChart
                  data={chartData}
                  color="#22d3ee"
                  color2="#f472b6"
                  height={300}
                  showArea
                  showArea2={viewMode === 'both'}
                  labelFormatter={viewMode === 'accuracy'
                    ? v => `${Math.round(v)}%`
                    : v => (Math.round(v * 10) / 10).toString()}
                  legend={
                    viewMode === 'both'
                      ? [
                          { label: '练习时长（分钟）', color: '#22d3ee' },
                          { label: '正确率（%）', color: '#f472b6' },
                        ]
                      : undefined
                  }
                />
              )}
            </div>
          </>
        )}

        {tab === 'byMode' && (
          <div className="space-y-4">
            <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 size={18} className="text-neon-cyan" />
                <h3 className="font-display font-bold text-lg text-slate-200">
                  按练习模式统计
                </h3>
                <span className="text-xs text-slate-500 ml-auto">
                  最近 {range} 天
                </span>
              </div>

              {modeStats.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Layers size={36} className="mx-auto mb-3 opacity-40" />
                  <p>暂无分模式数据</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {modeStats.map(item => (
                    <div
                      key={item.mode}
                      className="flex items-center gap-4 p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:border-slate-600/60 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-200 mb-1">
                          {getPracticeModeLabel(item.mode)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>⏱ {fmtDurationSec(item.duration)}</span>
                          <span>🎯 {Math.round(item.accuracy * 100)}%</span>
                          <span>🎮 {item.sessions} 局</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartModePractice(item.mode)}
                        className="btn-cyan !py-1.5 !px-3 text-sm"
                        disabled={status === 'playing' || status === 'paused'}
                      >
                        <Play size={14} className="inline mr-1" />
                        开始练习
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'wrongWords' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookX size={18} className="text-neon-red" />
                <h3 className="font-display font-bold text-lg text-slate-200">
                  错题复盘
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  共 {wrongRecords.length} 条
                </span>
                {wrongRecords.length > 0 && (
                  <button
                    onClick={handleClearWrong}
                    className="text-xs text-neon-red/80 hover:text-neon-red flex items-center gap-1 px-2 py-1 rounded hover:bg-neon-red/10 transition-colors"
                  >
                    <Trash2 size={14} />
                    清空
                  </button>
                )}
              </div>
            </div>

            {wrongRecords.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Trophy size={40} className="mx-auto mb-3 opacity-40 text-neon-green" />
                <p className="text-slate-400">太棒了！没有错题记录</p>
                <p className="text-sm mt-1 opacity-70">继续保持，争取零失误 🌟</p>
              </div>
            ) : (
              <>
                <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-5">
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-4">
                    <div className="bg-neon-red/10 border border-neon-red/30 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold font-mono text-neon-red">
                        {wrongRecords.length}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">错题种类</div>
                    </div>
                    <div className="bg-neon-yellow/10 border border-neon-yellow/30 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold font-mono text-neon-yellow">
                        {wrongRecords.reduce((a, b) => a + b.count, 0)}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">总错误次数</div>
                    </div>
                    <div className="bg-neon-cyan/10 border border-neon-cyan/30 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold font-mono text-neon-cyan">
                        {topWrong[0]?.count ?? 0}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">最多错误</div>
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-300 mb-3">
                    📝 高频错题 Top 15
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {topWrong.map((r, i) => (
                      <div
                        key={i}
                        className="group flex items-center gap-1.5 bg-neon-red/10 border border-neon-red/30 rounded-lg px-3 py-1.5"
                        title={`出现次数：${r.count}`}
                      >
                        <span className="font-mono text-sm text-neon-red/90">{r.text}</span>
                        <span className="text-xs text-neon-red/60">×{r.count}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleStartWrongPractice}
                    className="btn-pink w-full"
                    disabled={wrongRecords.length === 0 || status === 'playing' || status === 'paused'}
                  >
                    <Play size={16} className="inline mr-2" />
                    开始错题专项练习
                  </button>
                  {(status === 'playing' || status === 'paused') && (
                    <p className="text-xs text-center text-slate-500 mt-2">
                      请先结束当前游戏再开始专项练习
                    </p>
                  )}
                </div>

                <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-5">
                  <h4 className="text-sm font-semibold text-slate-300 mb-3">
                    📋 完整错题列表
                  </h4>
                  <div className="max-h-[300px] overflow-auto scrollbar-thin">
                    <table className="w-full text-sm">
                      <thead className="text-slate-500 text-xs sticky top-0 bg-slate-900">
                        <tr className="border-b border-slate-700/50">
                          <th className="text-left py-2 px-3">内容</th>
                          <th className="text-right py-2 px-3">错误次数</th>
                          <th className="text-right py-2 px-3">最近出现</th>
                          <th className="text-right py-2 px-3">所属模式</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...wrongRecords]
                          .sort((a, b) => b.count - a.count)
                          .map((r, i) => (
                            <tr
                              key={i}
                              className="border-b border-slate-800/50 last:border-none hover:bg-slate-800/30"
                            >
                              <td className="py-2 px-3 font-mono text-neon-red/90">
                                {r.text}
                              </td>
                              <td className="py-2 px-3 text-right text-neon-yellow font-mono">
                                ×{r.count}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-500 text-xs">
                                {formatTimeAgo(r.lastSeen)}
                              </td>
                              <td className="py-2 px-3 text-right text-slate-400 text-xs">
                                {getPracticeModeLabel(r.mode)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <div className="text-xs text-slate-500 pt-2">
          📝 数据存储在浏览器本地（localStorage），用于追踪你的练习进度。
        </div>
      </div>
    </Modal>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days} 天前`;
  if (hours > 0) return `${hours} 小时前`;
  if (mins > 0) return `${mins} 分钟前`;
  return '刚刚';
}
