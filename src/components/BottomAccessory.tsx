// ===== Acessório da base (o lugar do miniplayer) =====
// Uma barra de vidro que convive com a barra de abas do celular, como o miniplayer do Apple Music:
// em pé fica acima da barra de abas (ou entre os dois botões redondos quando a barra se recolhe ao
// rolar); deitado/tablet fica à direita da barra, dividindo a largura. No computador, flutua na base da
// área de conteúdo. Coloque dentro dele o que o seu app precisar (player, carrinho, status…).
import React from 'react';
import { motion } from 'motion/react';
import {
  MOBILE_BAR, MOBILE_GLASS_SHADOW, MOBILE_SHRINK_SCALE,
  miniPresenceStore, useMobileBarSplit, useTabBarCollapsed, tabBarStore,
} from './Navigation';

export function BottomAccessory({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const barCollapsed = useTabBarCollapsed();
  const split = useMobileBarSplit();
  const { size, compact, gap } = MOBILE_BAR;
  const [isDesktop, setIsDesktop] = React.useState(() => typeof window !== 'undefined' && !!window.matchMedia?.('(min-width: 1024px)').matches);
  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // A barra de abas sabe que há acessório (muda o jeito de se recolher)
  React.useEffect(() => {
    if (isDesktop) return;
    miniPresenceStore.set(true);
    return () => miniPresenceStore.set(false);
  }, [isDesktop]);

  // Posição (a mesma conta do miniplayer do app de origem)
  const inset = 'var(--mobile-bar-inset)';
  const barBottom = 'var(--mobile-bar-bottom)';
  const halfW = `((100vw - 2 * ${inset} - ${gap}px) / 2)`;
  const shrinkLoss = 1 - MOBILE_SHRINK_SCALE;
  const height = split ? (barCollapsed ? Math.round(size * MOBILE_SHRINK_SCALE) : size) : compact;
  const placement: React.CSSProperties = split
    ? {
        left: barCollapsed ? `calc(50% + ${gap / 2}px + ${halfW} * ${shrinkLoss})` : `calc(50% + ${gap / 2}px)`,
        right: inset,
        bottom: barBottom,
      }
    : barCollapsed
      ? { left: `calc(${inset} + ${compact + gap}px)`, right: `calc(${inset} + ${compact + gap}px)`, bottom: barBottom }
      : { left: inset, right: inset, bottom: `calc(${barBottom} + ${size + gap}px)` };
  // Posição pelo topo, a partir da altura total da tela (no app instalado no iPhone, até a base de verdade)
  if (placement.bottom !== undefined) {
    placement.top = `calc(var(--screen-h) - ${placement.bottom} - ${height}px)`;
    delete placement.bottom;
  }
  const posTransition = 'left 0.32s cubic-bezier(0.22, 1, 0.36, 1), right 0.32s cubic-bezier(0.22, 1, 0.36, 1), top 0.32s cubic-bezier(0.22, 1, 0.36, 1), height 0.32s cubic-bezier(0.22, 1, 0.36, 1)';

  const handleClick = () => {
    // Encolhido: o toque funciona normalmente e a barra volta ao tamanho padrão em seguida
    if (split && barCollapsed && !isDesktop) tabBarStore.set(false);
    onClick?.();
  };

  return (
    <motion.div
      id="mini-player"
      initial={{ y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0, transition: { duration: 0.14 } }}
      transition={{ type: 'spring', stiffness: 540, damping: 38, mass: 0.5 }}
      className={isDesktop
        ? "fixed z-[100] pointer-events-auto isolate left-[288px] right-4 rtl:left-4 rtl:right-[288px] mx-auto max-w-[520px]"
        : "fixed z-[96] pointer-events-auto isolate"}
      style={isDesktop ? { bottom: 'max(16px, env(safe-area-inset-bottom))' } : { ...placement, transition: posTransition }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 pointer-events-none backdrop-blur-xl border bg-card/80 border-[var(--button-secondary-bg)]"
        style={{ boxShadow: MOBILE_GLASS_SHADOW, borderRadius: isDesktop ? 28 : height / 2 }}
      />
      <div
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={handleClick}
        style={isDesktop ? undefined : { height, borderRadius: height / 2, transition: 'height 0.32s cubic-bezier(0.22, 1, 0.36, 1)' }}
        className={`mobile-press flex items-center gap-3 pl-4 pr-2 select-none ${onClick ? 'cursor-pointer' : ''} ${isDesktop ? 'h-14 rounded-[28px]' : ''}`}
      >
        {children}
      </div>
    </motion.div>
  );
}
