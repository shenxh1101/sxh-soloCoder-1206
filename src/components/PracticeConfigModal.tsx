import { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { useGameStore } from '@/stores/useGameStore';
import { useStatsStore } from '@/stores/useStatsStore';
import { PRACTICE_MODES } from '@/types';
import type { PracticeMode } from '@/types';
import {
  Settings2,
  ChevronRight,
  Check,
  Type,
} from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function PracticeConfigModal({ open, onClose }: Props) {
  const currentMode = useGameStore(s => s.practiceConfig.mode);
  const customChars = useGameStore(s => s.practiceConfig.customChars);
  const setPracticeMode = useGameStore(s => s.setPracticeMode);
  const status = useGameStore(s => s.status);
  const wrongCount = useStatsStore(s => s.wrongRecords.length);

  const [selectedMode, setSelectedMode] = useState<PracticeMode>(currentMode);
  const [customInput, setCustomInput] = useState(customChars.join(''));

  const canChange = status === 'idle' || status === 'gameover';

  const handleConfirm = () => {
    let chars: string[] = [];
    if (selectedMode === 'custom') {
      chars = [...new Set(customInput.split('').filter(c => c.trim()))];
    }
    setPracticeMode(selectedMode, chars);
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

  return (
    <Modal open={open} onClose={onClose} title="⚙️ 练习模式配置" accentColor="cyan">
      <div className="p-6 space-y-5">
        {!canChange && (
          <div className="bg-neon-yellow/10 border border-neon-yellow/30 text-neon-yellow text-sm rounded-xl p-3 flex items-start gap-2">
            <Type size={18} className="mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold mb-0.5">游戏进行中</div>
              <div className="text-xs opacity-90">请先结束或重开游戏，再切换练习模式</div>
            </div>
          </div>
        )}

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
