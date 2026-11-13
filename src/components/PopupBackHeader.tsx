// Cabeçalho dos pop-ups com segunda página, no padrão do Audiobook Player:
// voltar (pílula pequena com o nome da página anterior) à esquerda e o título centralizado no pop-up
import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft } from 'lucide-react';

export function PopupBackHeader({ title, onBack, backLabel = 'Mais opções' }: { title: React.ReactNode; onBack?: () => void; backLabel?: string }) {
  return (
    <div className={onBack
      ? 'grid grid-cols-[minmax(0,1fr)_minmax(0,auto)_minmax(0,1fr)] items-center gap-2 min-w-0'
      : 'flex items-center min-w-0 text-left rtl:text-right px-1.5'}>
      {onBack && (
        <motion.button
          type="button"
          data-press="true"
          data-hover-grow
          onClick={(e) => { e.stopPropagation(); onBack(); }}
          className="justify-self-start max-w-full h-7 px-2.5 rounded-full bg-card/75 shadow-md flex items-center gap-1.5 text-[var(--text-main)] hover:bg-[var(--hover-fill)] transition-all shrink-0 cursor-pointer text-xs font-semibold [&_svg]:text-inherit"
          title={backLabel}
          aria-label={backLabel}
        >
          <ChevronLeft size={14} className="rtl:rotate-180 shrink-0" />
          <span className="truncate">{backLabel}</span>
        </motion.button>
      )}
      <h4 className={`text-sm font-bold text-[var(--text-main)] truncate min-w-0 ${onBack ? 'text-center' : ''}`}>{title}</h4>
      {/* Coluna vazia do outro lado: mantém o título no centro do pop-up */}
      {onBack && <span aria-hidden="true" />}
    </div>
  );
}

export default PopupBackHeader;
