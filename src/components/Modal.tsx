import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  accentColor?: 'cyan' | 'purple' | 'pink' | 'green';
}

export function Modal({ open, onClose, title, children, accentColor = 'purple' }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const borderMap: Record<string, string> = {
    cyan: 'border-neon-cyan/40',
    purple: 'border-neon-purple/40',
    pink: 'border-neon-pink/40',
    green: 'border-neon-green/40',
  };
  const titleMap: Record<string, string> = {
    cyan: 'text-neon-cyan',
    purple: 'text-neon-purple',
    pink: 'text-neon-pink',
    green: 'text-neon-green',
  };

  return (
    <div className="modal-overlay" onClick={onClose} data-modal-open="true">
      <div
        className={`modal-content ${borderMap[accentColor]}`}
        onClick={e => e.stopPropagation()}
        data-modal-open="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-slate-800/40">
          <h2 className={`font-display font-bold text-xl ${titleMap[accentColor]}`}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-auto max-h-[calc(90vh-70px)] scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );
}
