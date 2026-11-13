// Fundo de cores em movimento (orbes desfocados), em tons da cor de destaque escolhida (como no Audiobook Player).
// Mesma ideia dos orbes do player em tela cheia do esqueleto. Usado nas telas iniciais e na área de
// arrastar arquivos do Conversor. O pai precisa ser `relative` e cortar o excesso (`overflow-hidden`).
import type React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useMotionPrefs } from '../lib/motionPrefs';
import { cn } from '../lib/cn';

const ORBS = [
  { color: 'var(--winblue)', className: '-top-[30%] -left-[15%] w-[70%] aspect-square', x: ['-6%', '22%', '-10%', '-6%'], y: ['-8%', '18%', '-12%', '-8%'], scale: [1, 1.25, 0.95, 1], duration: 18 },
  { color: 'color-mix(in oklch, var(--winblue) 45%, rgb(150 150 165))', className: '-top-[20%] -right-[18%] w-[62%] aspect-square', x: ['10%', '-20%', '12%', '10%'], y: ['6%', '-14%', '14%', '6%'], scale: [1.1, 0.9, 1.2, 1.1], duration: 22 },
  { color: 'color-mix(in oklch, var(--winblue) 60%, white)', className: '-bottom-[35%] left-[18%] w-[66%] aspect-square', x: ['-8%', '18%', '-16%', '-8%'], y: ['10%', '-12%', '6%', '10%'], scale: [1, 1.18, 0.92, 1], duration: 26 },
];

export function AmbientOrbs({ className, intensity = 1, style }: { className?: string; intensity?: number; style?: React.CSSProperties }) {
  const reduce = useReducedMotion();
  const { lite, paused } = useMotionPrefs();
  // Modo leve: os mesmos tons num gradiente parado, sem desfoque
  if (lite) {
    return (
      <div aria-hidden="true" style={{ ...style, opacity: 0.5 * intensity, background: `radial-gradient(circle at 15% 10%, ${ORBS[0].color} 0%, transparent 55%), radial-gradient(circle at 90% 20%, ${ORBS[1].color} 0%, transparent 50%), radial-gradient(circle at 40% 100%, ${ORBS[2].color} 0%, transparent 55%)` }}
        className={cn('absolute inset-0 overflow-hidden pointer-events-none -z-10', className)} />
    );
  }
  return (
    <div aria-hidden="true" style={style} className={cn('absolute inset-0 overflow-hidden pointer-events-none -z-10', className)}>
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className={cn('absolute rounded-full blur-[90px] transform-gpu', orb.className)}
          style={{ backgroundColor: orb.color, opacity: 0.38 * intensity }}
          animate={reduce || paused ? undefined : { x: orb.x, y: orb.y, scale: orb.scale }}
          transition={{ duration: orb.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default AmbientOrbs;
