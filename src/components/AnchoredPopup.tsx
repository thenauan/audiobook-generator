// ===== Pop-up que nasce do botão =====
// Pequeno, ancorado no elemento que o abriu e crescendo a partir dele (nunca centralizado na tela).
// Use dentro de um <AnimatePresence> para animar a saída.
import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { getButtonCoverPopupStyle, clearButtonCoverAnchorCache } from './Popovers';

export function AnchoredPopup({
  anchor,
  width,
  estimatedHeight,
  align = 'auto',
  onClose,
  className = '',
  children,
}: {
  anchor: HTMLElement | null;
  width: number;
  estimatedHeight: number;
  align?: 'auto' | 'left' | 'right';
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  // Sem o elemento de origem (ex.: o card saiu da tela) o pop-up não aparece solto: espera a origem voltar
  if (typeof document === 'undefined' || !anchor || !anchor.isConnected) return null;
  const close = () => {
    clearButtonCoverAnchorCache(anchor);
    onClose();
  };
  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998] cursor-default" onClick={close} />
      <motion.div
        data-popup-content="true"
        initial={{ opacity: 0, scale: 0.22 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.22, transition: { duration: 0.12, ease: [0.32, 0, 0.67, 0] } }}
        transition={{
          opacity: { duration: 0.12, ease: 'easeOut' },
          scale: { type: 'spring', stiffness: 540, damping: 36, mass: 0.55 },
        }}
        style={getButtonCoverPopupStyle(anchor, width, estimatedHeight, align)}
        onClick={(e) => e.stopPropagation()}
        className={`bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl z-[9999] flex flex-col text-left rtl:text-right overflow-hidden text-[var(--text-main)] ${className}`}
      >
        {children}
      </motion.div>
    </>,
    document.body
  );
}

export default AnchoredPopup;
