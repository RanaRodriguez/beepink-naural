import { useState, useEffect, type ChangeEvent, type KeyboardEvent, forwardRef } from 'react';
import styles from './Slider.module.css';

interface SliderProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  displayValue?: string;
  color?: 'pink' | 'purple' | 'slate' | 'teal' | 'blue';
  editable?: boolean;
  unit?: string;
  shortcutChar?: string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  displayValue,
  color = 'pink',
  editable = false,
  unit,
  shortcutChar
}, ref) => {
  const [inputValue, setInputValue] = useState(value.toString());

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const accentColors = {
    pink: 'text-pink-500',
    purple: 'text-purple-500',
    slate: 'text-slate-500',
    teal: 'text-teal-500',
    blue: 'text-blue-500',
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    // Validate: allow only numbers and one decimal point
    if (!/^\d*\.?\d*$/.test(rawValue)) {
      return;
    }

    setInputValue(rawValue);

    // Update parent immediately if value is valid and within range
    const newValue = parseFloat(rawValue);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  const commitValue = () => {
    let newValue = parseFloat(inputValue);
    if (isNaN(newValue)) {
      setInputValue(value.toString());
      return;
    }
    // Clamp on commit
    newValue = Math.min(Math.max(newValue, min), max);
    onChange(newValue);
    setInputValue(newValue.toString());
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitValue();
      (e.currentTarget as HTMLInputElement).blur();
      return;
    }

    // Handle Up/Down arrows
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const currentVal = parseFloat(inputValue) || min;

      const isUpOrRight = e.key === 'ArrowUp' || e.key === 'ArrowRight';
      const direction = isUpOrRight ? 1 : -1;

      const multiplier = e.shiftKey ? 10 : 1;
      const changeAmount = step * multiplier;

      const newValue = Math.min(Math.max(currentVal + direction * changeAmount, min), max);

      // Fix floating point precision issues (e.g. 0.1 + 0.2)
      // If step is integer (e.g. 1), precision is 0. If 0.1, it's 1.
      // But if we multiply by 10, we might change precision needs.
      // Generally sticking to the base step precision is safe or slightly more if needed.
      const stepDecimals = step.toString().split('.')[1]?.length || 0;
      const roundedValue = parseFloat(newValue.toFixed(stepDecimals));

      onChange(roundedValue);
      setInputValue(roundedValue.toString());
    }
  };

  const renderLabel = () => {
    if (!label) return null;

    if (!shortcutChar) return <span>{label}</span>;

    const index = label.toLowerCase().indexOf(shortcutChar.toLowerCase());
    if (index === -1) return <span>{label}</span>;

    const before = label.slice(0, index);
    const match = label.slice(index, index + 1);
    const after = label.slice(index + 1);

    return (
      <span>
        {before}
        <span className="underline decoration-slate-500 underline-offset-4 decoration-2">{match}</span>
        {after}
      </span>
    );
  };

  return (
    <div className="space-y-2 group focus-within:bg-slate-800/50 focus-within:rounded-lg -mx-2 px-2 py-1 transition-colors duration-200">
      {(label || displayValue || editable) && (
        <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-wider transition-colors group-hover:text-slate-300">
          {renderLabel()}
          {editable ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={inputValue}
                onChange={handleInputChange}
                onBlur={commitValue}
                onKeyDown={handleKeyDown}
                className="w-16 bg-slate-700/50 rounded px-1 py-0.5 text-right text-slate-200 focus:outline-none focus:ring-1 focus:ring-white appearance-none"
                aria-label={label ? `${label} value` : 'Slider value'}
              />
              {unit && <span className="text-slate-500">{unit}</span>}
            </div>
          ) : (
            displayValue && <span>{displayValue}</span>
          )}
        </div>
      )}
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onKeyDown={handleKeyDown}
        className={`${styles.slider} ${accentColors[color]}`}
        aria-label={label ? `${label} slider` : 'Slider'}
      />
    </div>
  );
});

Slider.displayName = 'Slider';
