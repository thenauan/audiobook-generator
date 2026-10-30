// Conteúdo de um pop-up de confirmação (título, descrição, confirmar e cancelar).
// Usado nas confirmações do cabeçalho e nos menus de opções (ex.: excluir um audiobook).
import React from 'react';
import { motion } from 'motion/react';
import { Trash2, X } from 'lucide-react';

export const POPUP_BUTTON_HOVER = { scale: 1.06 };
export const POPUP_BUTTON_TAP = { scale: 0.95 };

export function ConfirmPanel({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  icon,
  onConfirm,
  onCancel,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
  /** Conteúdo extra entre a descrição e os botões (ex.: a lista dos itens a excluir) */
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col p-4 text-left rtl:text-right">
      <h4 className="text-xl font-bold text-[var(--text-main)] px-1 mb-1.5">{title}</h4>
      {description && <p className="text-xs text-[var(--text-muted)] px-1 mb-4 leading-relaxed">{description}</p>}
      {children}
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <motion.button
          type="button"
          whileHover={POPUP_BUTTON_HOVER}
          whileTap={POPUP_BUTTON_TAP}
          onClick={(e) => { e.stopPropagation(); onConfirm(); }}
          className="h-8 px-4 rounded-full bg-card/75 border border-red-500/25 shadow-md text-red-500 font-semibold text-xs flex items-center gap-1.5 hover:bg-red-500/20 hover:border-red-400/45 hover:shadow-[0_0_14px_rgba(239,68,68,0.35)] transition-[background-color,border-color,box-shadow] cursor-pointer [&_svg]:text-inherit"
        >
          {icon || <Trash2 size={13} />}
          <span>{confirmLabel}</span>
        </motion.button>
        <motion.button
          type="button"
          whileHover={POPUP_BUTTON_HOVER}
          whileTap={POPUP_BUTTON_TAP}
          onClick={(e) => { e.stopPropagation(); onCancel(); }}
          className="h-8 px-4 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] font-semibold text-xs flex items-center gap-1.5 hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.25)] transition-[background-color,border-color,box-shadow] cursor-pointer [&_svg]:text-inherit"
        >
          <X size={13} />
          <span>{cancelLabel}</span>
        </motion.button>
      </div>
    </div>
  );
}

export default ConfirmPanel;
