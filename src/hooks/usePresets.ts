export interface FrontPreset {
  volume: number;
  noiseVolume: number;
  beatVolume: number;
  baseFreq: number;
  beatFreq: number;
}

export interface BackPreset {
  volume: number;
  neuralFreq: number;
  neuralPulseDepth: number;
  neuralPanDepth: number;
  neuralNoiseVolume: number;
}

type PresetSide = 'front' | 'back';
type PresetSlot = 1 | 2 | 3 | 4;

const getStorageKey = (side: PresetSide, slot: PresetSlot): string => {
  return `beepink-preset-${side}-${slot}`;
};

export const usePresets = () => {
  const savePreset = (side: PresetSide, slot: PresetSlot, data: FrontPreset | BackPreset): boolean => {
    try {
      const key = getStorageKey(side, slot);
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to save preset:', error);
      return false;
    }
  };

  const loadPreset = (side: PresetSide, slot: PresetSlot): FrontPreset | BackPreset | null => {
    try {
      const key = getStorageKey(side, slot);
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      const data = JSON.parse(stored);
      
      // Validate preset structure
      if (side === 'front') {
        const preset = data as FrontPreset;
        if (
          typeof preset.volume === 'number' &&
          typeof preset.noiseVolume === 'number' &&
          typeof preset.beatVolume === 'number' &&
          typeof preset.baseFreq === 'number' &&
          typeof preset.beatFreq === 'number'
        ) {
          return preset;
        }
      } else {
        const preset = data as BackPreset;
        if (
          typeof preset.volume === 'number' &&
          typeof preset.neuralFreq === 'number' &&
          typeof preset.neuralPulseDepth === 'number' &&
          typeof preset.neuralPanDepth === 'number' &&
          typeof preset.neuralNoiseVolume === 'number'
        ) {
          return preset;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load preset:', error);
      return null;
    }
  };

  const deletePreset = (side: PresetSide, slot: PresetSlot): boolean => {
    try {
      const key = getStorageKey(side, slot);
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to delete preset:', error);
      return false;
    }
  };

  const hasPreset = (side: PresetSide, slot: PresetSlot): boolean => {
    try {
      const key = getStorageKey(side, slot);
      return localStorage.getItem(key) !== null;
    } catch (error) {
      return false;
    }
  };

  return {
    savePreset,
    loadPreset,
    deletePreset,
    hasPreset,
  };
};

