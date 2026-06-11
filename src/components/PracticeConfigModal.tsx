import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { useGameStore } from '@/stores/useGameStore';
import { useStatsStore } from '@/stores/useStatsStore';
import { PRACTICE_MODES, TRAINING_PLANS } from '@/types';
import type { PracticeMode, GoalType, PracticeGoal, TrainingPlan } from '@/types';
import {
  Settings2,
  ChevronRight,
  Check,
  Type,
  Target,
  Clock,
  Flame,
  Gauge,
  Zap,
} from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const GOAL_PRESETS: { type: GoalType; value: number; label: string }[] = [
  { type: 'duration', value: 180, label: '练 3 分钟' },
  { type: 'duration', value: 300, label: '练 5 分钟' },
  { type: 'duration', value: 600, label: '练 10 分钟' },
  { type: 'correctCount', value: 50, label: '命中 50 次' },
  { type: 'correctCount', value: 100, label: '命中 100 次' },
  { type: 'correctCount', value: 200, label: '命中 200 次' },
  { type: 'accuracy', value: 90, label: '正确率 90%' },
  { type: 'accuracy', value: 95, label: '正确率 95%' },
  { type: 'accuracy', value: 98, label: '正确率 98%' },
];

const GOAL_ICONS: Record<GoalType, any> = {
  duration: Clock,
  correctCount: Flame,
  accuracy: Gauge,
};

export function PracticeConfigModal({ open, onClose }: Props) {
  const currentMode = useGameStore(s => s.practiceConfig.mode);
  const customChars = useGameStore(s => s.practiceConfig.customChars);
  const currentGoal = useGameStore(s => s.practiceConfig.goal);
  const setPracticeConfig = useGameStore(s => s.setPracticeConfig);
  const setPracticeMode = useGameStore(s => s.setPracticeMode);
  const status = useGameStore(s => s.status);
  const wrongCount = useStatsStore(s => s.wrongRecords.length);

  const [selectedMode, setSelectedMode] = useState<PracticeMode>(currentMode);
  const [customInput, setCustomInput] = useState(customChars.join(''));
  const [goalType, setGoalType] = useState<GoalType | null>(currentGoal?.type ?? null);
  const [goalValue, setGoalValue] = useState<number>(currentGoal?.value ?? 180);
  const [customGoalInput, setCustomGoalInput] = useState<string>('');

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSelectPlan = (plan: TrainingPlan) => {
    setSelectedPlan(plan.id);
    setSelectedMode(plan.mode);
    if (plan.customChars) setCustomInput(plan.customChars.join(''));
    setGoalType(plan.goal.type);
    setGoalValue(plan.goal.value);
    if (plan.wrongSort) {
      // wrongSort is for internal use, not directly shown here
    }
  };

  const canChange = status === 'idle' || status === 'gameover';

  const handleConfirm = () => {
    let chars: string[] = [];
    if (selectedMode === 'custom') {
      chars = [...new Set(customInput.split('').filter(c => c.trim()))];
    }
    const goal: PracticeGoal | null = goalType
      ? { type: goalType, value: goalValue }
      : null;

    const plan = selectedPlan ? TRAINING_PLANS.find(p => p.id === selectedPlan) : null;

    setPracticeConfig({
      mode: selectedMode,
      customChars: chars,
      label: getPracticeModeLabel(selectedMode),
      goal,
      wrongSort: plan?.wrongSort ?? 'count',
      wrongLimit: plan?.wrongLimit ?? 50,
    });
    onClose();
  };

  const previewChars = useMemo(() => {
    const easyChars = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const left = 'qwertasdfgzxcvb'.split('');
    const right = 'yuiophjklnm,'.split('');
    const home = 'asdfjkl;'.split('');
    const top = 'qwertyuiop'.split('');
    const bottom = 'zxcvbnm,./'.split('');
    const digits = '0123456789'.split('');

    switch (selectedMode) {
      case 'all': return easyChars.slice(0, 26);
      case 'leftHand': return left;
      case 'rightHand': return right;
      case 'homeRow': return home;
      case 'topRow': return top;
      case 'bottomRow': return bottom;
      case 'digitRow': return digits;
      case 'custom': return [...new Set(customInput.split('').filter(c => c.trim()))];
      case 'wrongWords': return [];
      default: return easyChars;
    }
  }, [selectedMode, customInput]);

  const presetsForType = GOAL_PRESETS.filter(p => p.type === goalType);

  return (
    <Modal open={open} onClose={onClose} title="⚙️ 练习模式配置" accentColor="cyan">
      <div className="p-6 space-y-5 max-h-[80vh] overflow-auto scrollbar-thin">
        {!canChange && (
          <div className="bg-neon-yellow/10 border border-neon-yellow/30 text-neon-yellow text-sm rounded-xl p-3 flex items-start gap-2">
            <Type size={18} className="mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold mb-0.5">游戏进行中</div>
              <div className="text-xs opacity-90">请先结束或重开游戏，再切换练习模式</div>
            </div>
          </div>
        )}

        <div>
          <div className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Zap size={16} className="text-neon-yellow" />
            训练计划
            <span className="text-xs text-slate-500 font-normal ml-1">快速开始</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TRAINING_PLANS.map(plan => {
              const isSelected = selectedPlan === plan.id;
              const isWrongPlan = plan.mode === 'wrongWords' && wrongCount === 0;
              return (
                <button
                  key={plan.id}
                  onClick={() => {
                    if (isWrongPlan) return;
                    handleSelectPlan(plan);
                  }}
                  disabled={!canChange || isWrongPlan}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-neon-yellow bg-neon-yellow/10 shadow-[0_0_10px_rgba(250,204,21,0.15)]'
                      : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'
                  } ${!canChange || isWrongPlan ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-100">{plan.name}</span>
                    {isSelected && <Check size={14} className="text-neon-yellow" />}
                  </div>
                  <div className="text-xs text-slate-500">
                    {getPracticeModeLabel(plan.mode)}
                    {plan.goal && (
                      <span className="text-slate-400 ml-1">
                        · {plan.goal.type === 'duration' ? `${plan.goal.value}秒` : plan.goal.type === 'correctCount' ? `${plan.goal.value}次` : `${plan.goal.value}%`}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-600 mt-2">
            选择计划后自动配置模式与目标，也可在下方手动调整
          </p>
        </div>

        <div>
          <div className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Target size={16} className="text-neon-cyan" />
            选择练习模式
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PRACTICE_MODES.map(mode => {
              const isSelected = selectedMode === mode.key;
              const isDisabled = !canChange;
              const isWrongMode = mode.key === 'wrongWords' && wrongCount === 0;
              return (
                <button
                  key={mode.key}
                  onClick={() => {
                    if (isDisabled || isWrongMode) return;
                    setSelectedMode(mode.key);
                  }}
                  disabled={isDisabled || isWrongMode}
                  className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-neon-cyan bg-neon-cyan/10 shadow-neon-cyan'
                      : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600'
                  } ${isDisabled || isWrongMode ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}`}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check size={16} className="text-neon-cyan" />
                    </div>
                  )}
                  <div className="text-3xl mb-2">{mode.icon}</div>
                  <div className="font-bold text-slate-100 mb-1">{mode.label}</div>
                  <div className="text-xs text-slate-400 leading-relaxed">
                    {mode.desc}
                    {isWrongMode && (
                      <span className="block text-neon-red/70 mt-1">暂无错题记录</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selectedMode === 'custom' && (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-3">
            <label className="text-sm font-semibold text-slate-200 block">
              ✏️ 输入你想练习的字符（自动去重）
            </label>
            <input
              type="text"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              placeholder="例如：asdfjkl;0123"
              disabled={!canChange}
              className="w-full bg-slate-900/70 border border-slate-600/60 rounded-lg px-4 py-3 font-mono text-lg text-slate-100 focus:outline-none focus:border-neon-cyan/70 focus:ring-1 focus:ring-neon-cyan/40 placeholder:text-slate-600 disabled:opacity-50"
            />
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>共 {[...new Set(customInput.split('').filter(c => c.trim()))].length} 个唯一字符</span>
              <button
                onClick={() => setCustomInput('asdfjkl;')}
                className="text-neon-cyan hover:underline"
                disabled={!canChange}
              >
                重置为基准键
              </button>
            </div>
          </div>
        )}

        {previewChars.length > 0 && selectedMode !== 'custom' && (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
            <div className="text-sm font-semibold text-slate-300 mb-2">
              🎯 包含的字符预览
            </div>
            <div className="flex flex-wrap gap-1.5">
              {previewChars.map((ch, i) => (
                <span
                  key={i}
                  className="w-8 h-8 flex items-center justify-center rounded-md bg-slate-900/70 border border-slate-700/60 font-mono text-sm text-neon-cyan"
                >
                  {ch}
                </span>
              ))}
            </div>
          </div>
        )}

        {selectedMode === 'wrongWords' && wrongCount > 0 && (
          <div className="bg-neon-red/10 border border-neon-red/30 rounded-xl p-4">
            <div className="text-sm font-semibold text-neon-red/90 mb-2">
              📝 将使用你的 {Math.min(wrongCount, 50)} 条错题记录作为练习内容
            </div>
            <p className="text-xs text-slate-400">
              系统会从你历史最常打错的内容中抽取，进行专项强化练习。
            </p>
          </div>
        )}

        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Target size={16} className="text-neon-pink" />
              设置练习目标（可选）
            </div>
            <button
              onClick={() => setGoalType(null)}
              disabled={!canChange || goalType === null}
              className="text-xs text-slate-500 hover:text-slate-300 disabled:opacity-40"
            >
              不设目标
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {([
              { k: 'duration' as GoalType, label: '时长' },
              { k: 'correctCount' as GoalType, label: '命中数' },
              { k: 'accuracy' as GoalType, label: '正确率' },
            ]).map(t => {
              const Icon = GOAL_ICONS[t.k];
              const active = goalType === t.k;
              return (
                <button
                  key={t.k}
                  onClick={() => {
                    if (!canChange) return;
                    setGoalType(t.k);
                    if (t.k === 'duration') setGoalValue(180);
                    if (t.k === 'correctCount') setGoalValue(50);
                    if (t.k === 'accuracy') setGoalValue(90);
                  }}
                  disabled={!canChange}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                    active
                      ? 'border-neon-pink bg-neon-pink/15 text-neon-pink'
                      : 'border-slate-700/60 text-slate-400 hover:text-slate-200'
                  } disabled:opacity-40`}
                >
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>

          {goalType && (
            <>
              <div className="flex flex-wrap gap-2">
                {presetsForType.map(p => (
                  <button
                    key={`${p.type}-${p.value}`}
                    onClick={() => canChange && setGoalValue(p.value)}
                    disabled={!canChange}
                    className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                      goalValue === p.value
                        ? 'border-neon-cyan bg-neon-cyan/15 text-neon-cyan'
                        : 'border-slate-700/60 text-slate-400 hover:text-slate-200'
                    } disabled:opacity-40`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">自定义:</span>
                <input
                  type="number"
                  value={customGoalInput}
                  onChange={e => setCustomGoalInput(e.target.value)}
                  onBlur={() => {
                    const v = parseInt(customGoalInput, 10);
                    if (!isNaN(v) && v > 0) setGoalValue(v);
                  }}
                  placeholder={
                    goalType === 'duration'
                      ? '秒数'
                      : goalType === 'correctCount'
                        ? '次数'
                        : '百分比 0-100'
                  }
                  className="w-24 bg-slate-900/70 border border-slate-600/60 rounded-lg px-3 py-1.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-neon-cyan/70 disabled:opacity-50"
                  disabled={!canChange}
                />
                <span className="text-xs text-slate-500">
                  {goalType === 'duration' ? '秒' : goalType === 'correctCount' ? '次' : '%'}
                </span>
                <span className="ml-auto text-xs text-slate-400">
                  当前目标: <span className="text-neon-cyan font-mono">{goalValue}{goalType === 'duration' ? '秒' : goalType === 'correctCount' ? '次' : '%'}</span>
                </span>
              </div>
            </>
          )}

          {!goalType && (
            <div className="text-xs text-slate-500">
              💡 未设置目标时，游戏将持续进行直到生命耗尽或手动结束
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canChange}
            className="btn-cyan flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Settings2 size={16} />
            确认使用
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </Modal>
  );
}

function getPracticeModeLabel(mode: PracticeMode): string {
  const map: Record<PracticeMode, string> = {
    all: '全键练习',
    leftHand: '左手区',
    rightHand: '右手区',
    homeRow: '基准键位',
    topRow: '上行键位',
    bottomRow: '下行键位',
    digitRow: '数字行',
    custom: '自定义',
    wrongWords: '错题专项',
  };
  return map[mode] ?? mode;
}
