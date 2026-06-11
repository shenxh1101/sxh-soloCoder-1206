import type { FallingItem as FallingItemType } from '@/types';

interface Props {
  item: FallingItemType;
  isActive: boolean;
}

export function FallingItem({ item, isActive }: Props) {
  const typed = item.typed;
  const remaining = item.text.slice(typed.length);

  return (
    <div
      className="absolute font-mono font-bold select-none pointer-events-none transition-transform"
      style={{
        left: `${item.x}%`,
        top: `${item.y}%`,
        transform: 'translate(-50%, -50%)',
        fontSize: isActive ? 'clamp(24px, 3vw, 40px)' : 'clamp(20px, 2.5vw, 34px)',
        letterSpacing: '0.1em',
      }}
    >
      {typed.length > 0 && (
        <span className="text-neon-green falling-text-glow">{typed}</span>
      )}
      <span
        className={`${
          isActive
            ? 'text-white falling-text-glow'
            : 'text-slate-200/90'
        }`}
        style={isActive ? { color: '#e0f2fe' } : undefined}
      >
        {remaining}
      </span>
      {isActive && (
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-0.5 bg-neon-cyan/60 rounded-full"
          style={{
            width: `${Math.max(20, item.text.length * 16)}px`,
            boxShadow: '0 0 8px #22d3ee',
          }}
        />
      )}
    </div>
  );
}
