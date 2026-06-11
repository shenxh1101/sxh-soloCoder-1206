import { useEffect, useState } from 'react';
import { StatusBar } from '@/components/StatusBar';
import { GameArea } from '@/components/GameArea';
import { VirtualKeyboard } from '@/components/VirtualKeyboard';
import { ControlPanel } from '@/components/ControlPanel';
import { WordEditor } from '@/components/WordEditor';
import { StatsPanel } from '@/components/StatsPanel';
import { PracticeConfigModal } from '@/components/PracticeConfigModal';
import { useWordStore } from '@/stores/useWordStore';
import { useStatsStore } from '@/stores/useStatsStore';
import { useGameStore } from '@/stores/useGameStore';

export default function Home() {
  const [showWordEditor, setShowWordEditor] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showPracticeConfig, setShowPracticeConfig] = useState(false);

  const loadLibrary = useWordStore(s => s.loadLibrary);
  const refreshStats = useStatsStore(s => s.refresh);
  const startGame = useGameStore(s => s.startGame);

  useEffect(() => {
    loadLibrary();
    refreshStats();
  }, [loadLibrary, refreshStats]);

  const handleStartPractice = (_mode: string) => {
    startGame();
  };

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
        onOpenPracticeConfig={() => setShowPracticeConfig(true)}
      />
      <VirtualKeyboard />

      <WordEditor open={showWordEditor} onClose={() => setShowWordEditor(false)} />
      <StatsPanel
        open={showStats}
        onClose={() => setShowStats(false)}
        onStartPractice={handleStartPractice}
      />
      <PracticeConfigModal
        open={showPracticeConfig}
        onClose={() => setShowPracticeConfig(false)}
      />
    </div>
  );
}
