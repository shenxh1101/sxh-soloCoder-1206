import { useEffect, useState } from 'react';
import { StatusBar } from '@/components/StatusBar';
import { GameArea } from '@/components/GameArea';
import { VirtualKeyboard } from '@/components/VirtualKeyboard';
import { ControlPanel } from '@/components/ControlPanel';
import { WordEditor } from '@/components/WordEditor';
import { StatsPanel } from '@/components/StatsPanel';
import { useWordStore } from '@/stores/useWordStore';
import { useStatsStore } from '@/stores/useStatsStore';

export default function Home() {
  const [showWordEditor, setShowWordEditor] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const loadLibrary = useWordStore(s => s.loadLibrary);
  const refreshStats = useStatsStore(s => s.refresh);

  useEffect(() => {
    loadLibrary();
    refreshStats();
  }, [loadLibrary, refreshStats]);

  return (
    <div className="w-full h-full flex flex-col bg-bg-darker relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            'radial-gradient(circle at 15% 10%, rgba(34, 211, 238, 0.08), transparent 40%), radial-gradient(circle at 85% 0%, rgba(168, 85, 247, 0.08), transparent 40%), radial-gradient(circle at 50% 100%, rgba(244, 114, 182, 0.06), transparent 45%)',
        }}
      />

      <StatusBar />
      <GameArea />
      <ControlPanel
        onOpenWordEditor={() => setShowWordEditor(true)}
        onOpenStats={() => setShowStats(true)}
      />
      <VirtualKeyboard />

      <WordEditor open={showWordEditor} onClose={() => setShowWordEditor(false)} />
      <StatsPanel open={showStats} onClose={() => setShowStats(false)} />
    </div>
  );
}
