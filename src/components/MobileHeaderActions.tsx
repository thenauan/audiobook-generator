import React, { useEffect, useRef, useState } from 'react';
import { ConfirmPanel } from './ConfirmPanel';
import { motion, AnimatePresence } from 'motion/react';
import { MoreHorizontal, Trash2, X } from 'lucide-react';
import { MenuOptionItem, MorphPopup, PopupMorphContainer, morphTriggerAnimate } from './Popovers';
import { getBackdropProps } from './popupUtils';
import { MobileConfirmCard } from './MobileConfirm';
import { useI18n } from '../i18n';

// ===== Mobile: no máximo dois botões à direita do cabeçalho =====
// Uma ação rápida e importante + um botão de três pontinhos com o restante das opções da tela.
// Ações podem executar algo direto, pedir confirmação ou abrir um painel — sempre transformando o
// próprio pop-up (estilo iOS), sem abrir janelas separadas.

export interface MobileHeaderAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  active?: boolean;
  // Recebe o botão de origem (para pop-ups globais nascerem dele)
  onClick?: (anchor: HTMLElement) => void;
  confirm?: { title: string; description?: string; content?: React.ReactNode; estimatedHeight?: number; confirmLabel: string; onConfirm: () => void; icon?: React.ReactNode; danger?: boolean };
  panel?: React.ReactNode;
  panelWidth?: number;
}

const circleBtn = "w-11 h-11 flex items-center justify-center rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl text-[var(--text-main)] backdrop-blur-3xl transition-all";
// Com dois botões, eles viram uma pílula só (como nos apps do iOS)
const pillShell = "flex items-center h-11 rounded-full bg-card/75 border border-[var(--text-main)]/10 shadow-xl backdrop-blur-3xl";
const pillBtn = "w-11 h-11 flex items-center justify-center rounded-full text-[var(--text-main)] transition-colors";

export function ConfirmView({ action, onCancel }: { action: MobileHeaderAction; onCancel: () => void }) {
  const { t } = useI18n();
  const c = action.confirm!;
  return (
    <ConfirmPanel
      title={c.title}
      description={c.description}
      confirmLabel={c.confirmLabel}
      cancelLabel={t('cancel')}
      icon={c.icon}
      onConfirm={() => { c.onConfirm(); onCancel(); }}
      onCancel={onCancel}
    >
      {c.content}
    </ConfirmPanel>
  );
}

function useCloseOnGlobalEvent(open: boolean, close: () => void) {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    const onCloseAll = () => closeRef.current();
    window.addEventListener('close-all-popups', onCloseAll);
    return () => window.removeEventListener('close-all-popups', onCloseAll);
  }, [open]);
}

// Ação rápida: executa, confirma ou abre painel a partir do próprio botão
function QuickActionButton({ action, inPill = false }: { action: MobileHeaderAction; inPill?: boolean }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  useCloseOnGlobalEvent(open, () => setOpen(false));
  const hasPopup = Boolean(action.panel);
  const [confirming, setConfirming] = useState(false);
  useCloseOnGlobalEvent(confirming, () => setConfirming(false));
  return (
    <div className={`relative w-11 h-11 shrink-0 ${open ? 'z-50' : 'z-10'}`}>
      <motion.button
        ref={btnRef}
        whileTap={{ scale: 0.9 }}
        animate={morphTriggerAnimate(open)}
        aria-label={action.label}
        title={action.label}
        onClick={(e) => {
          e.stopPropagation();
          if (action.confirm) {
            window.dispatchEvent(new Event('close-all-popups'));
            setConfirming(true);
          } else if (hasPopup) {
            window.dispatchEvent(new Event('close-all-popups'));
            setOpen(true);
          } else if (btnRef.current) {
            action.onClick?.(btnRef.current);
          }
        }}
        className={`${inPill ? pillBtn : circleBtn} ${action.active ? 'text-winblue border-winblue/40 bg-winblue/15' : ''} ${action.danger ? 'text-red-500 border-red-500/20' : ''}`}
      >
        {action.icon}
      </motion.button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40 cursor-default" {...getBackdropProps(() => setOpen(false))} />
            <MorphPopup
              key="quick-popup"
              originWidth={44}
              originHeight={44}
              data-popup-content="true"
              onClick={(e) => e.stopPropagation()}
              style={{ transformOrigin: 'top right', width: action.panelWidth || 300 }}
              className="absolute top-0 right-0 max-w-[calc(100vw-32px)] bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] rounded-[24px] shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {action.panel}
            </MorphPopup>
          </>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {confirming && action.confirm && (
          <MobileConfirmCard key="quick-confirm" onClose={() => setConfirming(false)}>
            <ConfirmView action={action} onCancel={() => setConfirming(false)} />
          </MobileConfirmCard>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MobileHeaderActions({
  quick,
  menu,
}: {
  quick?: MobileHeaderAction | null;
  menu?: MobileHeaderAction[];
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<string>('menu');
  // O painel aberto veio da lista de opções (então termina com "Mais opções", que volta para ela)
  const [viewFromMenu, setViewFromMenu] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const close = () => { setOpen(false); setView('menu'); setViewFromMenu(false); };
  useCloseOnGlobalEvent(open, close);

  const menuItems = (menu || []).filter(Boolean);
  const asPill = Boolean(quick) && menuItems.length > 0;
  // Na pílula, o pop-up cobre os dois botões e também lista a ação da esquerda
  const items = asPill && quick ? [quick, ...menuItems] : menuItems;
  const triggerWidth = asPill ? 88 : 44;
  const viewAction = items.find(a => a.id === view);
  const [confirmAction, setConfirmAction] = useState<MobileHeaderAction | null>(null);
  useCloseOnGlobalEvent(Boolean(confirmAction), () => setConfirmAction(null));

  // Executa uma ação; "fromMenu": escolhida na lista de opções
  const runAction = (action: MobileHeaderAction, fromMenu: boolean) => {
    if (action.confirm) {
      close();
      setConfirmAction(action);
      return;
    }
    if (action.panel) {
      if (!fromMenu) window.dispatchEvent(new Event('close-all-popups'));
      setView(action.id);
      setViewFromMenu(fromMenu);
      setOpen(true);
      return;
    }
    // Pop-ups globais nascem da pílula inteira (ou do botão, quando sozinho)
    const anchor = (asPill ? pillRef.current : btnRef.current) as HTMLElement | null;
    close();
    if (anchor) action.onClick?.(anchor);
  };

  const dotsButton = (
    <motion.button
      ref={btnRef}
      whileTap={{ scale: 0.9 }}
      animate={asPill ? undefined : morphTriggerAnimate(open)}
      aria-label={t('more_options')}
      title={t('more_options')}
      onClick={(e) => {
        e.stopPropagation();
        window.dispatchEvent(new Event('close-all-popups'));
        setView('menu');
        setViewFromMenu(false);
        setOpen(true);
      }}
      className={asPill ? pillBtn : circleBtn}
    >
      <MoreHorizontal size={19} />
    </motion.button>
  );

  return (
    <div className="flex items-center gap-2.5">
      {quick && !asPill && <QuickActionButton action={quick} />}
      {items.length > 0 && (
        <div className={`relative h-11 shrink-0 ${asPill ? 'w-[88px]' : 'w-11'} ${open ? 'z-50' : 'z-10'}`}>
          {asPill && quick ? (
            <motion.div ref={pillRef} animate={morphTriggerAnimate(open)} className={pillShell}>
              <motion.button
                whileTap={{ scale: 0.9 }}
                aria-label={quick.label}
                title={quick.label}
                onClick={(e) => { e.stopPropagation(); runAction(quick, false); }}
                className={`${pillBtn} ${quick.active ? 'text-winblue' : ''} ${quick.danger ? 'text-red-500' : ''}`}
              >
                {quick.icon}
              </motion.button>
              {dotsButton}
            </motion.div>
          ) : dotsButton}
          <AnimatePresence>
            {open && (
              <>
                <div className="fixed inset-0 z-40 cursor-default" {...getBackdropProps(close)} />
                <PopupMorphContainer
                  key="dots-menu"
                  activeKey={view}
                  direction={view === 'menu' ? -1 : 1}
                  targetWidth={view === 'menu' ? 220 : (viewAction?.panelWidth || 300)}
                  targetRadius={view === 'menu' ? 20 : 24}
                  originWidth={triggerWidth}
                  originHeight={44}
                  style={{ transformOrigin: 'top right' }}
                  className="absolute top-0 right-0 z-50 max-w-[calc(100vw-32px)]"
                >
                  {view === 'menu' || !viewAction ? (
                    <div className="flex flex-col p-1.5 text-left rtl:text-right">
                      {items.map(action => (
                        <MenuOptionItem
                          key={action.id}
                          icon={action.icon}
                          danger={action.danger}
                          immediate={Boolean(action.confirm || action.panel)}
                          onClick={() => runAction(action, true)}
                        >
                          <span>{action.label}</span>
                        </MenuOptionItem>
                      ))}
                    </div>
                  ) : viewAction.confirm ? (
                    <ConfirmView action={viewAction} onCancel={() => setView('menu')} />
                  ) : (
                    <div className="flex flex-col">
                      {viewAction.panel}
                      {/* Aberto a partir das opções: a última opção volta para elas */}
                      {viewFromMenu && (
                        <div className="px-1.5 pb-1.5 -mt-1">
                          <MenuOptionItem immediate icon={<MoreHorizontal size={14} />} onClick={() => setView('menu')}>
                            <span>{t('more_options')}</span>
                          </MenuOptionItem>
                        </div>
                      )}
                    </div>
                  )}
                </PopupMorphContainer>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
      <AnimatePresence>
        {confirmAction?.confirm && (
          <MobileConfirmCard key="menu-confirm" onClose={() => setConfirmAction(null)}>
            <ConfirmView action={confirmAction} onCancel={() => setConfirmAction(null)} />
          </MobileConfirmCard>
        )}
      </AnimatePresence>
    </div>
  );
}
