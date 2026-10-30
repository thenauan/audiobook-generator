// Cabeçalho dos pop-ups com segunda página: voltar (ícone + texto, à esquerda) e título centralizado no pop-up
import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';

export function PopupBackHeader({ title, onBack, backLabel = 'Voltar' }: { title: React.ReactNode; onBack?: () => void; backLabel?: string }) {
  return (
    <div className="relative flex items-center justify-center min-h-8 px-[88px]">
      {onBack && (
        <motion.button
          type="button"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          onClick={onBack}
          className="absolute left-0 rtl:left-auto rtl:right-0 top-0 h-8 pl-2 pr-3 gap-1 rounded-full flex items-center justify-center text-xs font-semibold bg-card/75 border border-[var(--text-main)]/10 text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] transition-[background-color,border-color,box-shadow] cursor-pointer [&_svg]:text-inherit"
          title={backLabel}
          aria-label={backLabel}
        >
          <ChevronLeft size={15} className="rtl:rotate-180 shrink-0" />
          <span>{backLabel}</span>
        </motion.button>
      )}
      <h4 className="text-xl font-bold text-[var(--text-main)] truncate text-center">{title}</h4>
    </div>
  );
}

export default PopupBackHeader;
