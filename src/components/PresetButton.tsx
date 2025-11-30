import { cva } from 'class-variance-authority';

interface PresetButtonProps {
  slot: 1 | 2 | 3 | 4;
  side: 'front' | 'back';
  isActive: boolean;
  hasPreset: boolean;
  onSave: () => void;
  onLoad: () => void;
  onDelete: () => void;
}

const containerVariants = cva(
  'flex flex-col flex-1 items-center gap-1 px-2 py-2 rounded-lg border transition-colors',
  {
    variants: {
      isActive: {
        true: '',
        false: 'border-slate-700/50 bg-slate-800/50',
      },
      side: {
        front: '',
        back: '',
      },
    },
    compoundVariants: [
      {
        isActive: true,
        side: 'front',
        class: 'border-pink-500 bg-pink-500/10',
      },
      {
        isActive: true,
        side: 'back',
        class: 'border-teal-500 bg-teal-500/10',
      },
    ],
  }
);

const buttonVariants = cva(
  'px-2 py-1 text-xs rounded transition-colors border',
  {
    variants: {
      variant: {
        save: 'bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white border-slate-600/50 hover:border-slate-500',
        'load-front': 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 hover:text-pink-200 border-pink-500/30 hover:border-pink-500/50',
        'load-back': 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 hover:text-teal-200 border-teal-500/30 hover:border-teal-500/50',
        delete: 'bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 border-red-500/30 hover:border-red-500/50',
      },
      disabled: {
        true: 'opacity-25 cursor-not-allowed pointer-events-none',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'load-front',
        disabled: true,
        class: 'hover:bg-pink-500/20 hover:text-pink-300 hover:border-pink-500/30',
      },
      {
        variant: 'load-back',
        disabled: true,
        class: 'hover:bg-teal-500/20 hover:text-teal-300 hover:border-teal-500/30',
      },
      {
        variant: 'delete',
        disabled: true,
        class: 'hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30',
      },
    ],
  }
);

export function PresetButton({
  slot,
  side,
  isActive,
  hasPreset,
  onSave,
  onLoad,
  onDelete,
}: PresetButtonProps) {
  return (
    <div className={containerVariants({ isActive, side })}>
      <div className="text-xs font-medium text-slate-400 mb-1">
        {hasPreset ? (
          <span className="underline decoration-slate-500 underline-offset-4 decoration-2">
            {slot}
          </span>
        ) : (
          slot
        )}
      </div>
      <div className="flex flex-col gap-1 w-full">
        <button
          type="button"
          onClick={onSave}
          className={buttonVariants({ variant: 'save' })}
          title="Save preset"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onLoad}
          disabled={!hasPreset}
          className={buttonVariants({ 
            variant: side === 'front' ? 'load-front' : 'load-back',
            disabled: !hasPreset 
          })}
          title={hasPreset ? "Load preset" : "No preset saved"}
        >
          Load
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={!hasPreset}
          className={buttonVariants({ 
            variant: 'delete',
            disabled: !hasPreset 
          })}
          title={hasPreset ? "Delete preset" : "No preset saved"}
        >
          Del
        </button>
      </div>
    </div>
  );
}

