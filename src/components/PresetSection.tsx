import { PresetButton } from './PresetButton';

interface PresetSectionProps {
  side: 'front' | 'back';
  activePreset: number | null;
  hasPreset: (slot: 1 | 2 | 3 | 4) => boolean;
  onSave: (slot: 1 | 2 | 3 | 4) => void;
  onLoad: (slot: 1 | 2 | 3 | 4) => void;
  onDelete: (slot: 1 | 2 | 3 | 4) => void;
}

export function PresetSection({
  side,
  activePreset,
  hasPreset,
  onSave,
  onLoad,
  onDelete,
}: PresetSectionProps) {
  return (
    <div className="pt-4 flex justify-center gap-2 mt-auto">
      {([1, 2, 3, 4] as const).map((slot) => (
        <PresetButton
          key={slot}
          slot={slot}
          side={side}
          isActive={activePreset === slot}
          hasPreset={hasPreset(slot)}
          onSave={() => onSave(slot)}
          onLoad={() => onLoad(slot)}
          onDelete={() => onDelete(slot)}
        />
      ))}
    </div>
  );
}

