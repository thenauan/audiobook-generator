// Animações dos cards de e-book no Conversor (entrar na lista, sair dela e virar "convertendo").
// Os dois cards (a converter / convertendo) usam o mesmo layoutId, então o card desliza de uma seção
// para a outra em vez de sumir e reaparecer.
import type { TargetAndTransition, Transition } from 'motion/react';

export const ebookLayoutId = (id: string) => `ebook-card-${id}`;

const LAYOUT_SPRING: Transition = { type: 'spring', stiffness: 360, damping: 34, mass: 0.8 };

export const CARD_INITIAL = { opacity: 0, y: 28, scale: 0.96, filter: 'blur(10px)' };
// Ao terminar, tira o filtro (um filter parado atrapalharia o desfoque de fundo dos elementos internos)
export const CARD_ANIMATE: TargetAndTransition = { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transitionEnd: { filter: 'none' } };
export const CARD_EXIT: TargetAndTransition = {
  opacity: 0,
  scale: 0.93,
  filter: 'blur(8px)',
  transition: { duration: 0.26, ease: [0.4, 0, 0.2, 1] as const },
};

// Ao virar "convertendo", o card já vem do lugar do anterior (layoutId): só um leve ajuste de opacidade
export const CONVERTING_INITIAL = { opacity: 0.6, scale: 0.98, filter: 'blur(4px)' };

export function cardTransition(delay = 0): Transition {
  return {
    layout: LAYOUT_SPRING,
    opacity: { duration: 0.34, ease: 'easeOut', delay },
    filter: { duration: 0.4, ease: 'easeOut', delay },
    y: { type: 'spring', stiffness: 260, damping: 26, mass: 0.9, delay },
    scale: { type: 'spring', stiffness: 260, damping: 26, mass: 0.9, delay },
  };
}
