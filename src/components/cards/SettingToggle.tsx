import { motion } from 'motion/react';

export function SettingToggle({
  checked,
  onChange,
  enabledLabel = "Ativado",
  disabledLabel = "Desativado",
  disabled = false
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  enabledLabel?: string;
  disabledLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (disabled) return;
        onChange(!checked);
      }}
      className={`flex items-center gap-3 shrink-0 select-none ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer group'}`}
    >
      <span className={`text-xs font-semibold transition-colors duration-150 ${checked ? 'text-winblue' : 'text-[var(--text-muted)]'}`}>
        {checked ? enabledLabel : disabledLabel}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={`relative w-[48px] h-[28px] rounded-full p-[4px] border transition-all duration-150 flex items-center ${
          disabled
            ? 'bg-card/40 border-[var(--text-main)]/5 cursor-not-allowed'
            : checked
              ? 'bg-winblue/20 border-winblue/40 group-hover:bg-winblue/25 group-hover:border-winblue/55 group-hover:shadow-[0_0_12px_rgba(var(--winblue-rgb),0.2)] cursor-pointer'
              : 'bg-card/75 backdrop-blur-3xl border-[var(--text-main)]/10 group-hover:bg-white/15 group-hover:border-white/20 cursor-pointer'
        }`}
      >
        <motion.div
          initial={false}
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 950, damping: 42, mass: 0.4 }}
          className="w-[18px] h-[18px] shrink-0 flex items-center justify-center"
        >
          <div className={`w-full h-full rounded-full transition-all duration-150 group-hover:scale-115 group-active:scale-95 shadow-sm ${
            checked ? 'bg-winblue' : 'bg-[var(--text-muted)]/70 dark:bg-white/70 group-hover:bg-[var(--text-main)]'
          }`} />
        </motion.div>
      </button>
    </div>
  );
}
