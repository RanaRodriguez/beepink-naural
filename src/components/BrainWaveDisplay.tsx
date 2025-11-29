interface BrainWaveDisplayProps {
  freq: number;
}

function getBrainWaveName(freq: number): string {
  if (freq < 4) return "Delta (Deep Sleep)";
  if (freq < 8) return "Theta (Meditation/Drowsiness)";
  if (freq < 13) return "Alpha (Relaxation)";
  if (freq < 30) return "Beta (Active Thinking)";
  return "Gamma (High Focus)";
}

export function BrainWaveDisplay({ freq }: BrainWaveDisplayProps) {
  return (
    <div className="text-center text-xs text-slate-500 bg-slate-900/50 p-2 rounded transition-colors hover:bg-slate-900/70">
      Current State: <span className="text-slate-300 font-medium">{getBrainWaveName(freq)}</span>
    </div>
  );
}

