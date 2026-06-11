import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { LineChart } from './LineChart';
import { useStatsStore } from '@/stores/useStatsStore';
import {
  Clock,
  Target,
  Flame,
  Calendar,
  TrendingUp,
  Trophy,
  Activity,
} from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Range = 7 | 30;
type ViewMode = 'duration' | 'accuracy' | 'both';

export function StatsPanel({ open, onClose }: Props) {
  const [range, setRange] = useState<Range>(7);
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const refresh = useStatsStore(s => s.refresh);
  const getLastDays = useStatsStore(s => s.getLastDays);
  const highestCombo = useStatsStore(s => s.highestCombo);

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
    const totalMinutes = rawData.reduce((a, b) => a + b.totalDuration, 0) / 60;
    const totalCorrect = rawData.reduce((a, b) => a + b.correctCount, 0);
    const totalWrong = rawData.reduce((a, b) => a + b.wrongCount, 0);
    const totalSessions = rawData.reduce((a, b) => a + b.sessions, 0);
    const activeDays = rawData.filter(d => d.totalDuration > 0 || d.sessions > 0).length;
    const avgAccuracyDenom = totalCorrect + totalWrong;
    const avgAccuracy = avgAccuracyDenom > 0 ? totalCorrect / avgAccuracyDenom : 0;

    return {
      totalMinutes,
      totalCorrect,
      totalWrong,
      totalSessions,
      activeDays,
      avgAccuracy,
    };
  }, [rawData]);

  const fmtDuration = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} 分钟`;
  };

  return (
    <Modal open={open} onClose={onClose} title="📊 练习统计" accentColor="pink">
      <div className="p-6 space-y-6">
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
              {fmtDuration(summary.totalMinutes * 60)}
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

        <div className="bg-slate-900/50 border border-slate-700/50 rounded-2xl p-5">
          <h3 className="font-display font-bold text-lg text-slate-200 mb-3">📅 每日明细</h3>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm font-mono">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-700/50">
                  <th className="py-2 px-3">日期</th>
                  <th className="py-2 px-3 text-right">时长</th>
                  <th className="py-2 px-3 text-right">正确</th>
                  <th className="py-2 px-3 text-right">错误</th>
                  <th className="py-2 px-3 text-right">正确率</th>
                  <th className="py-2 px-3 text-right">对局</th>
                </tr>
              </thead>
              <tbody>
                {[...rawData].reverse().map((d, i) => (
                  <tr
                    key={d.date + i}
                    className="border-b border-slate-800/50 last:border-none hover:bg-slate-800/30"
                  >
                    <td className="py-2 px-3 text-slate-300">{d.date}</td>
                    <td className="py-2 px-3 text-right text-neon-cyan">
                      {fmtDuration(d.totalDuration)}
                    </td>
                    <td className="py-2 px-3 text-right text-neon-green">{d.correctCount}</td>
                    <td className="py-2 px-3 text-right text-neon-red">{d.wrongCount}</td>
                    <td className="py-2 px-3 text-right text-neon-yellow">
                      {Math.round(d.accuracy * 100)}%
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400">{d.sessions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-xs text-slate-500 pt-2">
          📝 数据存储在浏览器本地（localStorage），用于追踪你的练习进度。
        </div>
      </div>
    </Modal>
  );
}
