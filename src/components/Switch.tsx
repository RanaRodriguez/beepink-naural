import { motion } from "motion/react";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export const Switch = ({ checked, onChange, label, className = "" }: SwitchProps) => {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {label && <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">{label}</span>}
      <motion.button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-white/10 px-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
        animate={{ backgroundColor: checked ? "rgb(219 39 119)" : "rgba(0, 0, 0, 0.4)" }}
        transition={{ duration: 0.2 }}
      >
        <span className="sr-only">Use setting</span>
        <motion.span
          aria-hidden="true"
          animate={{ x: checked ? 18 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0"
        />
      </motion.button>
    </div>
  );
};

