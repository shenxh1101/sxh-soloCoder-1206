import { useGameStore } from '@/stores/useGameStore';
import { KEYBOARD_LAYOUT, KEY_WIDTHS } from '@/utils/constants';
import { useMemo } from 'react';

export function VirtualKeyboard() {
  const activeKey = useGameStore(s => s.activeKey);

  const rows = useMemo(() => KEYBOARD_LAYOUT, []);

  const matches = (layoutKey: string, active: string | null): boolean => {
    if (!active) return false;
    if (layoutKey === active) return true;
    if (layoutKey.length === 1 && active.length === 1) {
      return layoutKey.toLowerCase() === active.toLowerCase();
    }
    return false;
  };

  const getKeyWidth = (k: string): string => {
    return KEY_WIDTHS[k] ?? 'w-12';
  };

  const getKeyHeight = (_k: string, rowIdx: number): string => {
    return rowIdx === 4 ? 'h-12' : 'h-11';
  };

  return (
    <div className="w-full px-6 py-4 bg-slate-900/60 backdrop-blur-md border-t border-slate-700/50">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col gap-1.5 items-center">
          {rows.map((row, ri) => (
            <div key={ri} className="flex gap-1.5 items-center justify-center w-full">
              {row.map((k, ki) => {
                const isActive = matches(k, activeKey);
                const label = k === 'Space' ? '⎵' : k;
                return (
                  <div
                    key={`${ri}-${ki}`}
                    className={`key-cap ${getKeyWidth(k)} ${getKeyHeight(k, ri)} ${
                      isActive ? 'key-active animate-glow-pulse text-neon-cyan' : 'text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    {label}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
