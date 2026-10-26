// ===== Blocos de conteúdo no padrão da interface =====
// Título de tela, seção com "Ver tudo", card com menu de opções (três pontinhos no computador, toque
// longo no celular) e abertura "de dentro do card", linhas de lista no estilo dos ajustes e estado vazio.
// São só a forma: troque os placeholders pelo conteúdo do seu app.
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import {
  MenuOptionItem, PagedMenu, PopupMorphContainer, morphTriggerAnimate, emitZoomOrigin,
  checkChapterMenuShouldOpenUp, checkIsLeftEdgeCard,
} from './Popovers';
import { getBackdropProps, useCloseOnOutsideScrollOrDrag } from './popupUtils';
import { MobileContextMenu, useLongPress, isMobileViewport } from './MobileContextMenu';
import { useI18n } from '../i18n';
import { cn } from '../lib/cn';

// Título grande da tela (some ao rolar e reaparece pequeno no centro do cabeçalho)
export function ScreenTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-main)] mb-12 max-md:mb-0 tracking-tight">
      {children}
    </h1>
  );
}

// Seção com título e o botão "Ver tudo" (pílula de vidro)
export function Section({ title, onSeeAll, children }: { title: string; onSeeAll?: () => void; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--text-main)]">{title}</h2>
        {onSeeAll && (
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={onSeeAll}
            className="h-8 pl-3.5 pr-2.5 rounded-full bg-card/75 backdrop-blur-3xl border border-[var(--text-main)]/10 shadow-sm text-[var(--text-main)] hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all text-xs font-semibold flex items-center gap-1"
          >
            <span>{t('see_all')}</span>
            <ChevronRight size={15} className="-mr-0.5 rtl:rotate-180" />
          </motion.button>
        )}
      </div>
      {children}
    </section>
  );
}

// Fileira de cards: grade no computador; no celular, uma linha com rolagem lateral (classe mobile-row)
export function CardRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mobile-row">
      {children}
    </div>
  );
}

// Grade de cards (telas "Ver tudo")
export function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mobile-grid-3">
      {children}
    </div>
  );
}

export interface CardMenuEntry {
  id: string;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  onSelect: () => void;
}

// Card quadrado com imagem/placeholder, título e subtítulo. Tocar abre (com a animação "de dentro do card");
// três pontinhos (computador) ou toque longo (celular) abrem o menu de opções.
export function PlaceholderCard({
  zoomKey,
  title,
  subtitle,
  gradient = 'from-sky-500 via-blue-600 to-indigo-800',
  image,
  onOpen,
  menu = [],
}: {
  // Identifica o card para a animação de abrir/voltar (use o id do item)
  zoomKey: string;
  title: string;
  subtitle?: string;
  gradient?: string;
  image?: string;
  onOpen: () => void;
  menu?: CardMenuEntry[];
}) {
  const { t } = useI18n();
  const [showOptions, setShowOptions] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [alignLeft, setAlignLeft] = useState(false);
  const coverRef = useRef<HTMLDivElement>(null);
  const handleClose = () => setShowOptions(false);

  useEffect(() => {
    if (!showOptions) return;
    const onCloseAll = () => setShowOptions(false);
    window.addEventListener('close-all-popups', onCloseAll);
    return () => window.removeEventListener('close-all-popups', onCloseAll);
  }, [showOptions]);
  useCloseOnOutsideScrollOrDrag(showOptions, handleClose);

  // Celular: toque longo abre o menu de contexto (o card se destaca e o menu surge junto dele)
  const [contextRect, setContextRect] = useState<DOMRect | null>(null);
  const contextElRef = useRef<HTMLElement | null>(null);
  useEffect(() => { if (!showOptions) setContextRect(null); }, [showOptions]);
  const openContextMenu = (el: HTMLElement) => {
    window.dispatchEvent(new Event('close-all-popups'));
    contextElRef.current = el;
    setContextRect(el.getBoundingClientRect());
    setShowOptions(true);
  };
  const longPress = useLongPress(openContextMenu);

  const open = () => {
    if (showOptions) { handleClose(); return; }
    emitZoomOrigin(coverRef.current, image, 24, zoomKey);
    onOpen();
  };

  const cover = (
    <div className={cn('w-full h-full flex items-center justify-center', !image && `bg-gradient-to-br ${gradient}`)}>
      {image
        ? <img src={image} alt="" className="w-full h-full object-cover" />
        : <div className="w-1/3 aspect-square rounded-[30%] bg-white/20 border border-white/25 backdrop-blur-xl" />}
    </div>
  );
  const menuBody = (
    <PagedMenu className="flex flex-col p-2">
      {menu.map(entry => (
        <MenuOptionItem key={entry.id} icon={entry.icon} danger={entry.danger} onClick={() => { handleClose(); entry.onSelect(); }}>
          <span>{entry.label}</span>
        </MenuOptionItem>
      ))}
    </PagedMenu>
  );

  return (
    <motion.div
      {...(menu.length ? longPress : {})}
      style={{ WebkitTouchCallout: 'none' }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className={`group/card relative flex flex-col ${showOptions ? 'z-50' : ''}`}
      onContextMenu={(e) => {
        if (!menu.length) return;
        e.preventDefault();
        e.stopPropagation();
        if (isMobileViewport()) { openContextMenu(e.currentTarget as HTMLElement); return; }
        window.dispatchEvent(new Event('close-all-popups'));
        setOpenUp(checkChapterMenuShouldOpenUp(e.clientY, 260));
        setAlignLeft(checkIsLeftEdgeCard(e.currentTarget));
        setShowOptions(true);
      }}
    >
      <div
        ref={coverRef}
        data-zoom-key={zoomKey}
        onClick={open}
        className="relative aspect-square w-full rounded-3xl overflow-hidden mb-2 cursor-pointer shadow-md group-hover/card:shadow-xl transition-shadow"
      >
        <div className="w-full h-full transition-transform duration-500 group-hover/card:scale-105">{cover}</div>
      </div>

      <div className="flex items-start justify-between gap-1.5 relative w-full">
        <div className="flex-1 min-w-0 pr-1 text-left rtl:text-right">
          <h4 onClick={open} className="text-sm font-bold text-[var(--text-main)] truncate cursor-pointer hover:text-winblue transition-colors" title={title}>
            {title}
          </h4>
          {subtitle && <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{subtitle}</p>}
        </div>

        {menu.length > 0 && (
          <div className={`relative w-8 h-8 shrink-0 transition-opacity duration-200 max-md:hidden ${showOptions ? 'opacity-100 z-50' : 'opacity-0 group-hover/card:opacity-100'}`}>
            {showOptions && !contextRect && <div className="fixed inset-0 z-40 cursor-default" {...getBackdropProps(handleClose)} />}
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.92 }}
              animate={morphTriggerAnimate(showOptions)}
              onClick={(e) => {
                e.stopPropagation();
                const next = !showOptions;
                window.dispatchEvent(new Event('close-all-popups'));
                if (next) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setOpenUp(checkChapterMenuShouldOpenUp(rect.bottom, 260));
                  setAlignLeft(checkIsLeftEdgeCard(e.currentTarget));
                  setShowOptions(true);
                } else handleClose();
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-3xl border border-[var(--text-main)]/10 text-[var(--text-main)] bg-card/75 hover:bg-white/15 hover:border-white/25 hover:shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-all cursor-pointer"
              title={t('more_options')}
            >
              <MoreHorizontal size={16} />
            </motion.button>
            <AnimatePresence>
              {showOptions && !contextRect && (
                <PopupMorphContainer
                  key="menu"
                  activeKey="options-list"
                  direction={-1}
                  targetWidth={180}
                  targetRadius={24}
                  openUp={openUp}
                  style={{ transformOrigin: `${openUp ? 'bottom' : 'top'} ${alignLeft ? 'left' : 'right'}` }}
                  className={`absolute ${openUp ? 'bottom-0' : 'top-0'} ${alignLeft ? 'left-0' : 'right-0'} z-50`}
                >
                  {menuBody}
                </PopupMorphContainer>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <MobileContextMenu
        open={showOptions && Boolean(contextRect)}
        rect={contextRect}
        sourceEl={contextElRef.current}
        preview={
          <div className="flex flex-col">
            <div className="w-full aspect-square rounded-3xl overflow-hidden shadow-2xl">{cover}</div>
            <p className="mt-2 px-0.5 text-sm font-bold text-[var(--text-main)] truncate">{title}</p>
          </div>
        }
        onClose={handleClose}
        activeKey="options-list"
        direction={-1}
        targetWidth={180}
        targetRadius={20}
        estimatedMenuHeight={52 * Math.min(menu.length, 6) + 16}
      >
        {menuBody}
      </MobileContextMenu>
    </motion.div>
  );
}

// Grupo de linhas no estilo dos ajustes (cada linha é um cartão de vidro arredondado)
export function ListGroup({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2.5">{children}</div>;
}

export function ListRow({
  icon,
  iconGradient = 'from-sky-500 to-blue-700',
  title,
  subtitle,
  trailing,
  onClick,
}: {
  icon?: React.ReactNode;
  iconGradient?: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className={cn(
        'settings-list-row py-3 sm:py-3.5 px-4 sm:px-5 rounded-[32px] bg-card/60 backdrop-blur-xl border border-[var(--text-main)]/10 transition-colors flex items-center justify-between gap-4',
        onClick && 'hover:bg-white/10 cursor-pointer mobile-press'
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        {icon && (
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${iconGradient} text-white flex items-center justify-center shrink-0 shadow-md`}>
            {icon}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-base text-[var(--text-main)] truncate">{title}</span>
          {subtitle && <span className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 truncate">{subtitle}</span>}
        </div>
      </div>
      {trailing ?? (onClick ? <ChevronRight size={16} className="text-[var(--text-muted)] shrink-0 rtl:rotate-180" /> : null)}
    </div>
  );
}

export function EmptyState({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <div className="w-full min-h-[240px] flex flex-col items-center justify-center gap-3 text-[var(--text-muted)]">
      {icon && <div className="w-14 h-14 rounded-full bg-card/60 border border-[var(--text-main)]/10 flex items-center justify-center">{icon}</div>}
      <p className="text-sm">{text}</p>
    </div>
  );
}
