// Fundo animado dos cards de e-book (carregados e convertendo): o mesmo efeito do player em tela cheia
// do Audiobook Player. Cinco orbes desfocados com tons da capa se movem e trocam de cor; por cima, a capa
// desfocada e uma camada de vidro (branca no tema claro, escura no escuro) para manter o texto legível.
// O card pai precisa ser `relative isolate overflow-hidden`.
import { useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { getCoverAmbientTones } from '../../lib/covers';

export function CoverAmbientBackground({ color, cover, isDark }: { color: string; cover?: string; isDark: boolean }) {
  const reduce = useReducedMotion();
  const t = useMemo(() => getCoverAmbientTones(color), [color]);

  const orbs = [
    {
      // Orbe 1: tom principal e variações da capa
      className: '-top-[60%] -left-[10%] w-[55%] opacity-75 blur-[70px]',
      x: ['-14%', '24%', '-10%', '-14%'], y: ['-12%', '20%', '-16%', '-12%'], scale: [1, 1.3, 0.94, 1], duration: 20,
      colors: isDark ? [t.tonePrimary, t.toneLight, t.toneDeep, t.tonePrimary] : [t.tonePrimary, t.toneMedium, t.toneLight, t.tonePrimary],
    },
    {
      // Orbe 2: luz e tons suaves
      className: '-top-[40%] -right-[8%] w-[48%] blur-[80px] ' + (isDark ? 'opacity-25' : 'opacity-75'),
      x: ['18%', '-22%', '14%', '18%'], y: ['12%', '-18%', '16%', '12%'], scale: [1.12, 0.88, 1.24, 1.12], duration: 25,
      colors: isDark ? [t.toneVeryLight, '#ffffff', t.toneLight, t.toneVeryLight] : [t.toneLight, t.tonePastel, t.tonePrimary, t.toneLight],
    },
    {
      // Orbe 3: no escuro, escuridão; no claro, tons médios
      className: '-bottom-[70%] left-[12%] w-[52%] blur-[70px] ' + (isDark ? 'opacity-85' : 'opacity-80'),
      x: ['-10%', '20%', '-18%', '-10%'], y: ['18%', '-14%', '12%', '18%'], scale: [0.95, 1.25, 1.05, 0.95], duration: 22,
      colors: isDark ? ['#000000', t.toneVeryDark, t.toneDeep, '#000000'] : [t.toneMedium, t.tonePrimary, t.tonePastel, t.toneMedium],
    },
    {
      // Orbe 4: tons escuros (escuro) ou médios e suaves (claro)
      className: '-bottom-[50%] -right-[10%] w-[50%] opacity-70 blur-[75px]',
      x: ['14%', '-16%', '10%', '14%'], y: ['-14%', '18%', '-10%', '-14%'], scale: [1.06, 0.92, 1.2, 1.06], duration: 27,
      colors: isDark ? [t.toneDeep, t.tonePrimary, t.toneVeryDark, t.toneDeep] : [t.toneLight, t.tonePrimary, t.toneMedium, t.toneLight],
    },
    {
      // Orbe 5: feixe central de luz
      className: 'top-[10%] left-[28%] w-[38%] blur-[85px] ' + (isDark ? 'opacity-20' : 'opacity-65'),
      x: ['-18%', '16%', '-8%', '-18%'], y: ['14%', '-18%', '12%', '14%'], scale: [0.92, 1.18, 0.88, 0.92], duration: 30,
      colors: isDark ? ['rgba(255,255,255,0.75)', t.toneVeryLight, 'rgba(0,0,0,0.65)', 'rgba(255,255,255,0.75)'] : [t.tonePastel, t.toneVeryLight, t.toneWhiteTint, t.tonePastel],
    },
  ];

  return (
    <div aria-hidden="true" className={`absolute inset-0 -z-10 overflow-hidden pointer-events-none rounded-[inherit] ${isDark ? 'bg-[#03060c]' : 'bg-white'}`}>
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute aspect-square rounded-full transform-gpu will-change-transform ${orb.className}`}
          style={{ backgroundColor: orb.colors[0] }}
          animate={reduce ? undefined : { x: orb.x, y: orb.y, scale: orb.scale, backgroundColor: orb.colors }}
          transition={{ duration: orb.duration, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Textura sutil da capa */}
      {cover && (
        <img
          src={cover}
          alt=""
          draggable={false}
          className={`absolute inset-0 w-full h-full object-cover blur-[60px] scale-110 transform-gpu ${isDark ? 'opacity-15 mix-blend-overlay' : 'opacity-20'}`}
        />
      )}

      {/* Vidro: equilibra o contraste (branco no claro, escuro no escuro) */}
      <div className={`absolute inset-0 ${isDark ? 'bg-black/45' : 'bg-white/40'}`} />
    </div>
  );
}

export default CoverAmbientBackground;
