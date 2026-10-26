import { useEffect, useRef, useState } from 'react';
import { motion, animate, useMotionValue } from 'motion/react';
import type { ZoomOriginDetail } from './Popovers';
import { isMobileViewport } from './MobileContextMenu';

type AnimationPlaybackControls = ReturnType<typeof animate>;

// Transição estilo "abrir/fechar app no iOS" entre um card (capa/foto) e a página do audiobook/autor.
// Anima com motion values (sem re-renderizar o App) e, ao fechar, acompanha o card de destino a cada
// quadro até ele parar, para a capa encaixar exatamente no lugar dela.

type ZoomRect = { left: number; top: number; width: number; height: number };

interface ZoomReturnEntry {
  rect: ZoomRect;
  image?: string;
  radius: number;
  scrollTop: number;
  // Tela em que o card estava quando a página foi aberta
  screenKey: string;
}

// Card de origem de cada página aberta
const returnMap = new Map<string, ZoomReturnEntry>();

// Só faz sentido "voltar para o ícone" se a tela de destino é a mesma de onde o card foi tocado
export function canZoomCloseTo(key: string, destinationScreenKey: string) {
  const entry = returnMap.get(key);
  return Boolean(entry && entry.screenKey === destinationScreenKey);
}

interface ZoomCloseDetail {
  key: string;
}

const OPEN_SPRING = { type: 'spring' as const, stiffness: 620, damping: 50, mass: 0.6 };
const CLOSE_SPRING = { type: 'spring' as const, stiffness: 660, damping: 52, mass: 0.55 };
// Tempo máximo acompanhando o card de destino (ele também está animando a entrada)
const TRACK_MS = 600;
const FIND_TIMEOUT_MS = 900;

export function requestZoomClose(key: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ZoomCloseDetail>('zoom-close', { detail: { key } }));
}

// A página (com o fundo desfocado da capa) ocupa a tela inteira, inclusive atrás do menu lateral
function getScreenRect(): ZoomRect | null {
  if (typeof window === 'undefined') return null;
  return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
}

// Mobile (em pé): as páginas do audiobook e do autor têm a capa/foto de ponta a ponta no topo;
// a imagem do card vira essa imagem. Deitado, as páginas mostram a imagem ao lado das informações.
const LANDSCAPE_PHONE_QUERY = '(orientation: landscape) and (max-height: 600px)';
function canUseHero(key?: string) {
  if (!key || !isMobileViewport()) return false;
  if (!key.startsWith('book-') && !key.startsWith('author-')) return false;
  return !(window.matchMedia && window.matchMedia(LANDSCAPE_PHONE_QUERY).matches);
}
function getHeroRect(key: string): ZoomRect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const height = key.startsWith('author-') ? Math.min(vw, vh * 0.62) : Math.min(vw * 1.5, vh * 0.74);
  return { left: 0, top: 0, width: vw, height };
}
const HERO_FADE = 'linear-gradient(to bottom, black 55%, transparent 84%)';

const sameRect = (a: ZoomRect, b: ZoomRect) =>
  Math.abs(a.left - b.left) < 0.5 && Math.abs(a.top - b.top) < 0.5 &&
  Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5;

export default function ZoomTransitionLayer({
  getScrollContainer,
  getCurrentScreenKey,
  onCloseMidway,
}: {
  getScrollContainer: () => HTMLElement | null;
  getCurrentScreenKey: () => string;
  // Chamado quando a página está 50% recolhida para dentro do card (ou se o fechamento for cancelado)
  onCloseMidway?: () => void;
}) {
  const [phase, setPhase] = useState<{ id: number; image?: string; hero?: boolean } | null>(null);
  const left = useMotionValue(0);
  const top = useMotionValue(0);
  const width = useMotionValue(0);
  const height = useMotionValue(0);
  const radius = useMotionValue(0);
  const imageOpacity = useMotionValue(1);
  const layerOpacity = useMotionValue(1);

  const runIdRef = useRef(0);
  const controlsRef = useRef<AnimationPlaybackControls[]>([]);
  const rafRef = useRef<number | null>(null);
  const getScrollRef = useRef(getScrollContainer);
  getScrollRef.current = getScrollContainer;
  const getScreenKeyRef = useRef(getCurrentScreenKey);
  getScreenKeyRef.current = getCurrentScreenKey;
  const onCloseMidwayRef = useRef(onCloseMidway);
  onCloseMidwayRef.current = onCloseMidway;

  // Capas de destino escondidas enquanto a página volta para dentro delas
  const hiddenCardsRef = useRef<HTMLElement[]>([]);
  // Já revelada nesta animação (não esconde de novo ao continuar acompanhando o card)
  const cardsRevealedRef = useRef(false);
  const showHiddenCards = () => {
    cardsRevealedRef.current = true;
    // A capa surge no card com um fade-in suave
    hiddenCardsRef.current.forEach(el => {
      el.style.transition = 'opacity 0.2s ease-out';
      el.style.opacity = '';
      setTimeout(() => { if (!el.style.opacity) el.style.transition = ''; }, 260);
    });
    hiddenCardsRef.current = [];
  };

  const stopAll = () => {
    showHiddenCards();
    controlsRef.current.forEach(c => c.stop());
    controlsRef.current = [];
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const setRect = (r: ZoomRect) => {
    left.set(r.left);
    top.set(r.top);
    width.set(r.width);
    height.set(r.height);
  };

  // Anima o retângulo até o destino; reanimar no meio preserva a velocidade (sem "solavancos")
  const animateRect = (r: ZoomRect, spring: typeof OPEN_SPRING) => {
    const c = [
      animate(left, r.left, spring),
      animate(top, r.top, spring),
      animate(width, r.width, spring),
      animate(height, r.height, spring),
    ];
    controlsRef.current = [...controlsRef.current.filter(x => !c.includes(x)), ...c];
    return Promise.all(c);
  };

  const finish = (runId: number, fadeDuration: number) => {
    if (runIdRef.current !== runId) return;
    const c = animate(layerOpacity, 0, { duration: fadeDuration, ease: 'easeOut' });
    controlsRef.current.push(c);
    c.then(() => {
      if (runIdRef.current === runId) setPhase(null);
    });
  };

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<ZoomOriginDetail>).detail;
      const target = getScreenRect();
      if (!detail || !target) return;
      if (detail.key) {
        returnMap.set(detail.key, {
          rect: detail.rect,
          image: detail.image,
          radius: detail.radius,
          scrollTop: getScrollRef.current()?.scrollTop || 0,
          screenKey: getScreenKeyRef.current(),
        });
      }
      stopAll();
      const runId = ++runIdRef.current;
      setRect(detail.rect);
      radius.set(detail.radius);
      imageOpacity.set(1);
      layerOpacity.set(1);
      const heroMode = Boolean(detail.image && canUseHero(detail.key));
      setPhase({ id: runId, image: detail.image, hero: heroMode });

      if (heroMode) {
        // A capa não some: cresce até a posição da capa grande da página e então se dissolve nela
        animate(radius, 0, OPEN_SPRING);
        animateRect(getHeroRect(detail.key || ''), OPEN_SPRING).then(() => finish(runId, 0.16));
        return;
      }

      animate(radius, 0, OPEN_SPRING);
      controlsRef.current.push(animate(imageOpacity, 0, { duration: 0.26, delay: 0.04, ease: 'easeOut' }));
      animateRect(target, OPEN_SPRING).then(() => finish(runId, 0.2));
    };

    const onClose = (e: Event) => {
      const { key } = (e as CustomEvent<ZoomCloseDetail>).detail || ({} as ZoomCloseDetail);
      const from = getScreenRect();
      const entry = key ? returnMap.get(key) : undefined;
      if (!key || !from || !entry) {
        onCloseMidwayRef.current?.();
        return;
      }

      stopAll();
      cardsRevealedRef.current = false;
      const runId = ++runIdRef.current;
      // Mobile: parte da capa grande da página (se visível) e encolhe para dentro do card, sempre visível
      const heroEl = canUseHero(key) ? document.querySelector('[data-zoom-hero="true"]') : null;
      const heroRect = heroEl ? heroEl.getBoundingClientRect() : null;
      const heroMode = Boolean(heroRect && heroRect.bottom > 0 && entry.image);
      setRect(heroMode && heroRect ? { left: heroRect.left, top: heroRect.top, width: heroRect.width, height: heroRect.height } : from);
      radius.set(0);
      imageOpacity.set(heroMode ? 1 : 0);
      layerOpacity.set(1);
      setPhase({ id: runId, image: entry.image, hero: heroMode });

      // Progresso do recolhimento (pela largura) para trocar a cor do menu lateral aos 50%
      let midwayFired = false;
      const fireMidway = () => {
        if (midwayFired) return;
        midwayFired = true;
        onCloseMidwayRef.current?.();
      };
      let unsubscribeProgress: (() => void) | null = null;

      const startedAt = performance.now();
      let foundAt = 0;
      let current: ZoomRect | null = null;
      let restoredScroll = false;
      let settledPromise: Promise<unknown> | null = null;

      const measure = (): ZoomRect | null => {
        const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-zoom-key="${key}"]`));
        if (els.length === 0) return null;
        // A capa no card só aparece quando a animação de voltar terminar de encaixar nela
        if (!cardsRevealedRef.current) els.forEach(el => {
          if (!hiddenCardsRef.current.includes(el)) {
            el.style.transition = 'none';
            el.style.opacity = '0';
            hiddenCardsRef.current.push(el);
          }
        });
        if (!restoredScroll) {
          restoredScroll = true;
          const sc = getScrollRef.current();
          if (sc && entry.scrollTop >= 0) sc.scrollTop = entry.scrollTop;
        }
        // Se o item aparece em várias seções, usa o mais próximo do card de onde a página foi aberta
        const best = els
          .map(el => el.getBoundingClientRect())
          .filter(r => r.width > 0 && r.height > 0)
          .sort((ra, rb) =>
            (Math.abs(ra.top - entry.rect.top) + Math.abs(ra.left - entry.rect.left)) -
            (Math.abs(rb.top - entry.rect.top) + Math.abs(rb.left - entry.rect.left)))[0];
        return best ? { left: best.left, top: best.top, width: best.width, height: best.height } : null;
      };

      const goTo = (r: ZoomRect) => {
        current = r;
        if (!unsubscribeProgress) {
          unsubscribeProgress = width.on('change', (w) => {
            const target = current || r;
            const startW = heroMode && heroRect ? heroRect.width : from.width;
            const total = startW - target.width;
            const progress = total > 0 ? (startW - w) / total : 0;
            if (progress >= 0.5) fireMidway();
            // A capa volta a aparecer no card quando a animação está 95% concluída
            if (progress >= 0.95) {
              showHiddenCards();
              unsubscribeProgress?.();
            }
          });
        }
        settledPromise = animateRect(r, CLOSE_SPRING);
      };

      const tick = () => {
        if (runIdRef.current !== runId) return;
        const now = performance.now();
        const r = measure();
        if (r) {
          if (!foundAt) {
            foundAt = now;
            animate(radius, entry.radius, CLOSE_SPRING);
            if (!heroMode) controlsRef.current.push(animate(imageOpacity, 1, { duration: 0.2, delay: 0.04, ease: 'easeIn' }));
            goTo(r);
          } else if (current && !sameRect(current, r)) {
            // O card ainda está se acomodando (animação de entrada): segue o movimento dele
            goTo(r);
          }
          if (now - foundAt < TRACK_MS) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }
        } else if (now - startedAt < FIND_TIMEOUT_MS) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        } else if (!current) {
          // O card não apareceu (ex.: item removido): apenas dissolve a camada, sem "voltar para o ícone"
          rafRef.current = null;
          fireMidway();
          showHiddenCards();
          finish(runId, 0.18);
          return;
        }
        rafRef.current = null;
        (settledPromise || Promise.resolve()).then(() => {
          unsubscribeProgress?.();
          if (runIdRef.current !== runId) return;
          fireMidway();
          showHiddenCards();
          finish(runId, 0.14);
        });
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener('zoom-origin', onOpen);
    window.addEventListener('zoom-close', onClose);
    return () => {
      window.removeEventListener('zoom-origin', onOpen);
      window.removeEventListener('zoom-close', onClose);
      stopAll();
    };
    // Motion values são estáveis
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!phase) return null;

  return (
    <motion.div
      key={phase.id}
      aria-hidden="true"
      className={`fixed z-[25] pointer-events-none overflow-hidden ${phase.hero ? '' : 'shadow-2xl'}`}
      style={{
        left,
        top,
        width,
        height,
        borderRadius: radius,
        opacity: layerOpacity,
        backgroundColor: phase.hero ? 'transparent' : 'var(--bg-mica)',
        willChange: 'left, top, width, height, border-radius, opacity',
      }}
    >
      {phase.image && (
        <>
          {/* Fundo desfocado da capa, como o ambiente da página */}
          {!phase.hero && <img
            src={phase.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-[140px] opacity-20 scale-125 dark:opacity-30 dark:mix-blend-screen"
          />}
          {/* A capa some ao abrir e reaparece, exatamente sobre o card, ao fechar */}
          <motion.img
            src={phase.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: imageOpacity, ...(phase.hero ? { WebkitMaskImage: HERO_FADE, maskImage: HERO_FADE } : {}) }}
          />
        </>
      )}
    </motion.div>
  );
}
