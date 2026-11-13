// ===== Ações do cabeçalho =====
// Cada ação é um botão redondo com uma única função (sem menu de três pontinhos). Ao passar o mouse,
// o botão cresce e brilha, como o botão de voltar. Ações destrutivas pedem confirmação no cartão da base;
// ações que abrem um pop-up recebem o próprio botão como origem (o pop-up nasce dele), inclusive as
// confirmações.
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { morphTriggerAnimate } from './Popovers';
import { AnchoredPopup } from './AnchoredPopup';
import { ConfirmView, type MobileHeaderAction } from './MobileHeaderActions';
import { cn } from '../lib/cn';

export interface HeaderAction extends MobileHeaderAction {
  // O pop-up desta ação está aberto (o botão "vira" o pop-up)
  open?: boolean;
  tone?: 'default' | 'accent' | 'danger' | 'warning';
  // Texto ao lado do ícone (vira uma pílula): só para a ação principal da tela
  text?: string;
  // Sem nada para fazer agora: aparece apagado e não responde
  disabled?: boolean;
}

const base = "w-9 h-9 flex items-center justify-center rounded-full shadow-xl backdrop-blur-3xl transition-[background-color,border-color,box-shadow,color] duration-200 cursor-pointer [&_svg]:text-inherit";
const TONES: Record<NonNullable<HeaderAction['tone']>, string> = {
  default: "bg-card/75 text-[var(--text-main)] hover:bg-[var(--hover-fill)]",
  accent: "bg-winblue/20 text-winblue hover:bg-winblue/30",
  danger: "bg-card/75 text-red-500 hover:bg-red-500/20",
  warning: "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25",
};

const SPRING = { type: 'spring' as const, stiffness: 520, damping: 36, mass: 0.55 };

export function HeaderActionButtons({ actions }: { actions: HeaderAction[] }) {
  const [confirming, setConfirming] = useState<{ action: HeaderAction; anchor: HTMLElement } | null>(null);

  // Trocar de tela ou abrir outro pop-up fecha a confirmação
  const confirmingRef = useRef(confirming);
  confirmingRef.current = confirming;
  useEffect(() => {
    const onCloseAll = () => { if (confirmingRef.current) setConfirming(null); };
    window.addEventListener('close-all-popups', onCloseAll);
    return () => window.removeEventListener('close-all-popups', onCloseAll);
  }, []);

  return (
    <div className="flex items-center gap-2.5">
      <AnimatePresence initial={false}>
        {actions.map(action => {
          const tone = action.tone || (action.danger ? 'danger' : action.active ? 'accent' : 'default');
          return (
            <motion.button data-popup-trigger
              key={action.id}
              layout="position"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={action.open || confirming?.action.id === action.id ? morphTriggerAnimate(true) : { opacity: action.disabled ? 0.4 : 1, scale: 1, pointerEvents: 'auto' as const }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.1 } }}
              transition={SPRING}
              aria-label={action.label}
              aria-disabled={action.disabled || undefined}
              title={action.label}
              onClick={(e) => {
                e.stopPropagation();
                if (action.disabled) return;
                window.dispatchEvent(new Event('close-all-popups'));
                if (action.confirm) setConfirming({ action, anchor: e.currentTarget });
                else action.onClick?.(e.currentTarget);
              }}
              className={cn(
                base,
                TONES[tone],
                action.text && "w-auto px-4 gap-2 text-xs font-semibold",
                action.disabled && "cursor-not-allowed hover:bg-card/75 hover:shadow-xl"
              )}
            >
              {action.icon}
              {action.text && <span>{action.text}</span>}
            </motion.button>
          );
        })}
      </AnimatePresence>

      <AnimatePresence>
        {confirming?.action.confirm && (
          <AnchoredPopup key="header-confirm" anchor={confirming.anchor} width={300} estimatedHeight={confirming.action.confirm.estimatedHeight ?? 150} onClose={() => setConfirming(null)}>
            <ConfirmView action={confirming.action} onCancel={() => setConfirming(null)} />
          </AnchoredPopup>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HeaderActionButtons;
