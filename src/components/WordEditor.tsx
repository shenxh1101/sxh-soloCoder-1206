import { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { useWordStore } from '@/stores/useWordStore';
import type { WordLibrary } from '@/types';
import { DEFAULT_WORD_LIBRARY } from '@/utils/defaultWords';
import {
  Upload,
  Download,
  RotateCcw,
  Check,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const TABS: { key: keyof WordLibrary; label: string; hint: string; color: string }[] = [
  { key: 'easy', label: '简单', hint: '单字母', color: 'text-neon-green border-neon-green' },
  { key: 'digits', label: '数字', hint: '0-9 数字', color: 'text-neon-yellow border-neon-yellow' },
  { key: 'normal', label: '普通', hint: '3-5字母短单词', color: 'text-neon-cyan border-neon-cyan' },
  { key: 'hard', label: '困难', hint: '6+字母长单词', color: 'text-neon-pink border-neon-pink' },
];

export function WordEditor({ open, onClose }: Props) {
  const library = useWordStore(s => s.library);
  const saveLibrary = useWordStore(s => s.saveLibrary);
  const resetLibrary = useWordStore(s => s.resetLibrary);
  const loadLibrary = useWordStore(s => s.loadLibrary);

  const [activeTab, setActiveTab] = useState<keyof WordLibrary>('easy');
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [newWord, setNewWord] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      loadLibrary();
    }
  }, [open, loadLibrary]);

  useEffect(() => {
    if (open) {
      setJsonText(JSON.stringify(library, null, 2));
      setError(null);
    }
  }, [open, library]);

  const currentWords = library[activeTab];

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText) as WordLibrary;
      if (!parsed || typeof parsed !== 'object') throw new Error('必须是JSON对象');
      const keys: (keyof WordLibrary)[] = ['easy', 'digits', 'normal', 'hard'];
      for (const k of keys) {
        if (!Array.isArray(parsed[k])) throw new Error(`${k} 必须是字符串数组`);
        if (parsed[k].some((w: unknown) => typeof w !== 'string')) {
          throw new Error(`${k} 数组元素必须是字符串`);
        }
      }
      saveLibrary({
        easy: (parsed.easy ?? []).filter((w: string) => w.length > 0),
        digits: (parsed.digits ?? []).filter((w: string) => w.length > 0),
        normal: (parsed.normal ?? []).filter((w: string) => w.length > 0),
        hard: (parsed.hard ?? []).filter((w: string) => w.length > 0),
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON 解析失败');
    }
  };

  const validateJson = () => {
    try {
      JSON.parse(jsonText);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON 解析失败');
    }
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(library, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `word-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as WordLibrary;
      if (!parsed || typeof parsed !== 'object') throw new Error('必须是JSON对象');
      const keys: (keyof WordLibrary)[] = ['easy', 'digits', 'normal', 'hard'];
      for (const k of keys) {
        if (!Array.isArray(parsed[k])) throw new Error(`${k} 必须是字符串数组`);
      }
      saveLibrary({
        easy: (parsed.easy ?? []).filter((w: unknown) => typeof w === 'string' && w.length > 0),
        digits: (parsed.digits ?? []).filter((w: unknown) => typeof w === 'string' && w.length > 0),
        normal: (parsed.normal ?? []).filter((w: unknown) => typeof w === 'string' && w.length > 0),
        hard: (parsed.hard ?? []).filter((w: unknown) => typeof w === 'string' && w.length > 0),
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '文件导入失败');
    }
  };

  const addWord = () => {
    const w = newWord.trim();
    if (!w) return;
    const updated: WordLibrary = {
      ...library,
      [activeTab]: [...library[activeTab], w],
    };
    saveLibrary(updated);
    setNewWord('');
  };

  const removeWord = (idx: number) => {
    const arr = [...library[activeTab]];
    arr.splice(idx, 1);
    saveLibrary({ ...library, [activeTab]: arr });
  };

  const restoreDefaults = () => {
    if (confirm('确定恢复为默认词库？当前自定义词库将被覆盖。')) {
      resetLibrary();
      setError(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="📚 词库编辑器" accentColor="purple">
      <div className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFileUpload(f);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-purple flex items-center gap-2"
            >
              <Upload size={16} />
              上传 JSON
            </button>
            <button onClick={downloadJson} className="btn-cyan flex items-center gap-2">
              <Download size={16} />
              下载 JSON
            </button>
            <button onClick={restoreDefaults} className="btn-pink flex items-center gap-2">
              <RotateCcw size={16} />
              恢复默认
            </button>
          </div>
          <div className="text-xs text-slate-400">
            词库格式: <code className="text-neon-cyan">{"{ easy, digits, normal, hard } string[]"}</code>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-300">JSON 编辑器</label>
              <div className="flex gap-2">
                <button
                  onClick={validateJson}
                  className="text-xs px-3 py-1 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600/40"
                >
                  校验
                </button>
                <button
                  onClick={applyJson}
                  className="text-xs px-3 py-1 rounded-lg bg-neon-green/15 hover:bg-neon-green/25 text-neon-green border border-neon-green/40 flex items-center gap-1"
                >
                  <Check size={12} /> 应用
                </button>
              </div>
            </div>
            <textarea
              value={jsonText}
              onChange={e => setJsonText(e.target.value)}
              onBlur={validateJson}
              spellCheck={false}
              className="w-full h-[360px] font-mono text-xs bg-slate-950/60 text-slate-200 rounded-xl p-3 border border-slate-700/60 focus:outline-none focus:border-neon-purple/60 focus:ring-1 focus:ring-neon-purple/40 scrollbar-thin"
            />
            {error && (
              <div className="flex items-start gap-2 text-neon-red text-sm bg-neon-red/10 border border-neon-red/30 rounded-lg p-3">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold mb-0.5">错误</div>
                  <div className="text-xs opacity-90">{error}</div>
                </div>
              </div>
            )}
          </div>

          <div className="col-span-12 lg:col-span-7 space-y-3">
            <div className="flex gap-2 flex-wrap">
              {TABS.map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
                    activeTab === t.key
                      ? `${t.color} bg-slate-800/60`
                      : 'text-slate-400 border-slate-700/50 hover:text-slate-200'
                  }`}
                >
                  <div>{t.label}</div>
                  <div className="text-[10px] opacity-70 font-normal">
                    {t.hint} · {library[t.key].length} 条
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newWord}
                onChange={e => setNewWord(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') addWord();
                }}
                placeholder={`向「${TABS.find(t => t.key === activeTab)?.label}」词库添加新词...`}
                className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-neon-cyan/60 placeholder:text-slate-500"
              />
              <button
                onClick={addWord}
                className="btn-green flex items-center gap-1.5"
                disabled={!newWord.trim()}
              >
                <Plus size={16} /> 添加
              </button>
            </div>

            <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-3 max-h-[320px] overflow-auto scrollbar-thin">
              {currentWords.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  当前词库为空，添加新词或导入JSON吧
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {currentWords.map((w, i) => (
                    <div
                      key={`${w}-${i}`}
                      className="group flex items-center gap-1.5 bg-slate-800/70 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-sm font-mono hover:border-neon-red/50 transition-colors"
                    >
                      <span className="text-slate-200">{w}</span>
                      <button
                        onClick={() => removeWord(i)}
                        className="text-slate-500 hover:text-neon-red transition-colors"
                        title="删除"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-700/50 text-xs text-slate-500 space-y-1">
          <div>💡 <strong>提示：</strong></div>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>词库将保存在浏览器本地（localStorage）中，清除浏览器数据会丢失</li>
            <li>简单模式掉单字母、普通模式掉短单词、困难模式掉长单词</li>
            <li>建议下载当前词库作为备份，或下载默认词库 <a
              className="text-neon-cyan underline cursor-pointer"
              onClick={() => {
                const blob = new Blob([JSON.stringify(DEFAULT_WORD_LIBRARY, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'default-word-library.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >default-word-library.json</a></li>
          </ul>
        </div>
      </div>
    </Modal>
  );
}
