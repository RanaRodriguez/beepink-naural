import { motion } from "motion/react";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

const SwitchButtonOn = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked="true"
    onClick={onClick}
    className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-white/10 px-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 bg-pink-600"
  >
    <span className="sr-only">Use setting</span>
    <motion.span
      aria-hidden="true"
      animate={{ x: 18 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
    />
  </button>
);

const SwitchButtonOff = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked="false"
    onClick={onClick}
    className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-white/10 px-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 bg-black/40 backdrop-blur-sm"
  >
    <span className="sr-only">Use setting</span>
    <motion.span
      aria-hidden="true"
      animate={{ x: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out"
    />
  </button>
);

export const Switch = ({ checked, onChange, label, className = "" }: SwitchProps) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {label && <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">{label}</span>}
      {checked ? (
        <SwitchButtonOn onClick={() => onChange(false)} />
      ) : (
        <SwitchButtonOff onClick={() => onChange(true)} />
      )}
    </div>
  );
};

