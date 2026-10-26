import React from 'react';
import { motion } from 'motion/react';
import { MoreHorizontal } from 'lucide-react';
import { BsPlayFill } from 'react-icons/bs';
import { clearButtonCoverAnchorCache } from '../Popovers';
import { getGenericBookCover } from '../../lib/covers';
import { SelectionCheck } from '../SelectionCheck';

// Componente UniversalCard (Seção 29 do DESIGN_SYSTEM.md e Screenshot 4)
export interface UniversalCardProps {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  aspectRatio?: string;
  badgeText?: string;
  badgeIcon?: React.ReactNode;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  actionTooltip?: string;
  onOptions?: (anchorEl: HTMLElement) => void;
  onClick?: () => void;
  isMenuOpen?: boolean;
  /** Modo de seleção (Convertidos): o clique marca/desmarca o item */
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export const UniversalCard: React.FC<UniversalCardProps> = ({
  id,
  title,
  subtitle,
  image,
  aspectRatio = "aspect-[1/1.6]",
  badgeText,
  badgeIcon,
  onAction,
  actionIcon,
  actionTooltip = "Ação",
  onOptions,
  onClick,
  isMenuOpen = false,
  selectMode = false,
  selected = false,
  onToggleSelect,
}) => {
  const effectiveCover = image || getGenericBookCover(title, subtitle);

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="group/card relative flex flex-col"
    >
      <div 
        onClick={selectMode ? onToggleSelect : onClick}
        className={`relative ${aspectRatio} w-full rounded-3xl overflow-hidden mb-2 cursor-pointer shadow-md group-hover/card:shadow-xl transition-shadow bg-card/60 flex items-center justify-center`}
      >
        <img
          src={effectiveCover}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
        />

        {badgeText && (
          <div className="absolute top-2.5 left-2.5 z-10 h-6 px-2.5 rounded-full bg-black/60 backdrop-blur-md border border-white/30 flex items-center gap-1 shadow-lg text-white pointer-events-none text-[10px] font-bold">
            {badgeIcon}
            <span>{badgeText}</span>
          </div>
        )}

        <SelectionCheck active={selectMode} selected={selected} onToggle={() => onToggleSelect?.()} />

        {onAction && !selectMode && (
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              title={actionTooltip}
              onClick={(e) => {
                e.stopPropagation();
                onAction();
              }}
              className="w-13 h-13 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-2xl border border-white/30 hover:border-white/75 shadow-2xl flex items-center justify-center text-white pointer-events-auto hover:shadow-[0_0_25px_rgba(255,255,255,0.65)] cursor-pointer"
            >
              {actionIcon || (
                <span className="translate-x-[2px] transition-colors">
                  <BsPlayFill size={28} />
                </span>
              )}
            </motion.button>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-1.5 mt-2 relative">
        <div className="flex-1 min-w-0 pr-1">
          <h4 
            onClick={selectMode ? onToggleSelect : onClick}
            title={title}
            className="text-sm font-bold text-[var(--text-main)] truncate cursor-pointer hover:text-winblue transition-colors"
          >
            {title}
          </h4>
          <p 
            title={subtitle}
            className="text-xs text-[var(--text-muted)] truncate mt-0.5"
          >
            {subtitle}
          </p>
        </div>

        {onOptions && !selectMode && (
          <div className={`relative w-8 h-8 shrink-0 ${isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover/card:opacity-100'} transition-opacity duration-200`}>
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.92 }}
              animate={isMenuOpen ? { scale: 1.22, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1, pointerEvents: 'auto' }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              onClick={(e) => {
                e.stopPropagation();
                clearButtonCoverAnchorCache(e.currentTarget);
                onOptions(e.currentTarget);
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] bg-card/75 hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all cursor-pointer"
            >
              <MoreHorizontal size={16} />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
