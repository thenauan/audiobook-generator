// Fundo de cores em movimento (orbes desfocados), com as cores do ícone do app.
// Mesma ideia dos orbes do player em tela cheia do esqueleto. Usado nas telas iniciais e na área de
// arrastar arquivos do Conversor. O pai precisa ser `relative` e cortar o excesso (`overflow-hidden`).
import type React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../lib/cn';

const ORBS = [
  { color: '#1f5fd6', className: '-top-[30%] -left-[15%] w-[70%] aspect-square', x: ['-6%', '22%', '-10%', '-6%'], y: ['-8%', '18%', '-12%', '-8%'], scale: [1, 1.25, 0.95, 1], duration: 18 },
  { color: '#b3214a', className: '-top-[20%] -right-[18%] w-[62%] aspect-square', x: ['10%', '-20%', '12%', '10%'], y: ['6%', '-14%', '14%', '6%'], scale: [1.1, 0.9, 1.2, 1.1], duration: 22 },
  { color: '#0f8a5a', className: '-bottom-[35%] left-[18%] w-[66%] aspect-square', x: ['-8%', '18%', '-16%', '-8%'], y: ['10%', '-12%', '6%', '10%'], scale: [1, 1.18, 0.92, 1], duration: 26 },
];

export function AmbientOrbs({ className, intensity = 1, style }: { className?: string; intensity?: number; style?: React.CSSProperties }) {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden="true" style={style} className={cn('absolute inset-0 overflow-hidden pointer-events-none -z-10', className)}>
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className={cn('absolute rounded-full blur-[90px] transform-gpu', orb.className)}
          style={{ backgroundColor: orb.color, opacity: 0.38 * intensity }}
          animate={reduce ? undefined : { x: orb.x, y: orb.y, scale: orb.scale }}
          transition={{ duration: orb.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

export default AmbientOrbs;
