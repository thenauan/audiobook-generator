// ===== Pop-ups no estilo Apple =====
// Morph "botão → pop-up" (o pop-up nasce do botão que o abriu e volta para dentro dele), troca de
// conteúdo com desfoque, opções de menu, paginação no celular (no máximo 6 opções por vez) e
// posicionamento inteligente na tela.
import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, type HTMLMotionProps } from 'motion/react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/cn';
import { useI18n } from '../i18n';

export function MenuOptionItem({
  icon,
  children,
  onClick,
  danger = false,
  variant,
  immediate = false,
  className = ""
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  onClick: (e?: any) => void;
  danger?: boolean;
  variant?: 'default' | 'danger' | 'play' | 'favorite';
  immediate?: boolean;
  className?: string;
}) {
  const [clicked, setClicked] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (immediate) {
      onClick(e);
      return;
    }
    if (clicked) return;
    // A ação acontece na hora; o destaque do clique continua visível enquanto o pop-up se fecha
    setClicked(true);
    onClick(e);
    setTimeout(() => setClicked(false), 180);
  };

  const textContent = typeof children === 'string'
    ? children
    : (Array.isArray(children) ? children : [children])
        .map((c: any) => (typeof c === 'string' ? c : (c?.props?.children || '')))
        .join(' ');
  const lower = textContent.toLowerCase();

  const isDanger = danger || variant === 'danger' || lower.includes('excluir') || lower.includes('apagar');

  const variantClasses = isDanger
    ? (clicked
        ? "bg-red-500/20 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.25)]"
        : "text-red-500 hover:bg-red-500/15 hover:text-red-400 hover:shadow-[0_0_12px_rgba(239,68,68,0.2)]")
    : (clicked
        ? "bg-slate-400/25 text-slate-900 shadow-[0_0_12px_rgba(100,116,139,0.3)] dark:bg-white/20 dark:text-white dark:shadow-[0_0_12px_rgba(255,255,255,0.2)]"
        : "text-[var(--text-main)] hover:bg-white/15 hover:text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]");

  return (
    <motion.button
      animate={clicked ? { scale: 1.03 } : { scale: 1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 650, damping: 32, mass: 0.45 }}
      onClick={handleClick}
      className={cn(
        "group w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium rounded-2xl transition-all duration-150 select-none text-left [&_svg]:transition-colors [&_svg]:shrink-0",
        variantClasses,
        className
      )}
    >
      {icon && (
        <span className="shrink-0 flex items-center justify-center text-inherit [&_svg]:text-inherit [&_svg]:stroke-current">
          {icon}
        </span>
      )}
      {children}
    </motion.button>
  );
}

// ===== Pop-ups no celular: no máximo 6 opções por vez =====
// Com mais opções, a 6ª vira "Mais opções", que troca a lista pelas seguintes; na última página,
// "Mais opções" volta para as primeiras (ou para a lista anterior, quando há uma — onBackToParent).
// No computador (ou com poucas opções) a lista aparece inteira.
const COMPACT_POPUP_QUERY = '(max-width: 1023px)';
function subscribeCompactPopup(cb: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const mq = window.matchMedia(COMPACT_POPUP_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}
function getCompactPopup() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(COMPACT_POPUP_QUERY).matches;
}
export function useCompactPopups(): boolean {
  return React.useSyncExternalStore(subscribeCompactPopup, getCompactPopup, () => false);
}

function flattenOptions(children: React.ReactNode): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  React.Children.forEach(children, (child) => {
    if (child === null || child === undefined || child === false || child === true || child === '') return;
    if (React.isValidElement(child) && child.type === React.Fragment) {
      out.push(...flattenOptions((child.props as any).children));
      return;
    }
    if (typeof child === 'string' && !child.trim()) return;
    out.push(child);
  });
  return out;
}

export const MAX_POPUP_OPTIONS = 6;

export function PagedMenu({
  children,
  className = "",
  onBackToParent,
  max = MAX_POPUP_OPTIONS,
}: {
  children: React.ReactNode;
  className?: string;
  onBackToParent?: () => void;
  max?: number;
}) {
  const { t } = useI18n();
  const compact = useCompactPopups();
  const [page, setPage] = useState(0);
  const items = flattenOptions(children);
  const needsPaging = compact && (items.length > max || Boolean(onBackToParent));
  if (!needsPaging) {
    return <div className={className}>{children}</div>;
  }
  const perPage = Math.max(1, max - 1);
  const pages: React.ReactNode[][] = [];
  for (let i = 0; i < items.length; i += perPage) pages.push(items.slice(i, i + perPage));
  if (pages.length === 0) pages.push([]);
  const current = Math.min(page, pages.length - 1);
  const isLast = current >= pages.length - 1;
  // Troca de página: as novas opções só aparecem suavemente no lugar (sem animar alturas em conflito com o pop-up)
  return (
    <motion.div
      key={`page-${current}`}
      initial={{ opacity: 0, scale: 0.95, filter: 'blur(6px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ opacity: { duration: 0.2 }, filter: { duration: 0.22 }, scale: MORPH_BOUNCE_SPRING }}
    >
      <div className={className}>
        {pages[current]}
        <MenuOptionItem
          immediate
          icon={<MoreHorizontal size={14} />}
          onClick={() => {
            if (!isLast) { setPage(current + 1); return; }
            if (onBackToParent) { onBackToParent(); return; }
            setPage(0);
          }}
        >
          <span>{t('more_options')}</span>
        </MenuOptionItem>
      </div>
    </motion.div>
  );
}

// ===== Morph "botão → pop-up" (estilo Apple) =====
// O pop-up nasce exatamente no retângulo do botão que o abriu (mesmo canto ancorado) e se expande
// até o tamanho final via clip-path; ao fechar, encolhe de volta para o botão. Sem distorcer o conteúdo.
// Molas dos menus no estilo do iOS 26: o botão "se estica" até virar o menu com uma leve ultrapassagem
// (efeito líquido) e, ao fechar, o menu se recolhe de volta para dentro do botão
export const MORPH_SPRING = { type: "spring" as const, stiffness: 170, damping: 21, mass: 1 };
export const MORPH_BOUNCE_SPRING = { type: "spring" as const, stiffness: 190, damping: 17, mass: 1 };
const MORPH_EXIT_SPRING = { type: "spring" as const, stiffness: 260, damping: 30, mass: 0.9 };
// Margem negativa para não cortar a sombra do pop-up depois de aberto
export const MORPH_EXPANDED_CLIP = 'inset(calc(0% + -80px) calc(0% + -80px) calc(0% + -80px) calc(0% + -80px) round 100px)';

export function getButtonMorphClip(
  width: number,
  height: number,
  alignRight: boolean,
  openUp: boolean,
  radius?: number,
  offsetX?: number
): string {
  const r = radius ?? Math.min(width, height) / 2;
  const near = 'calc(0% + 0px)';
  const farX = `calc(100% + -${Math.round(width)}px)`;
  const farY = `calc(100% + -${Math.round(height)}px)`;
  const top = openUp ? farY : near;
  const bottom = openUp ? near : farY;
  let left = alignRight ? farX : near;
  let right = alignRight ? near : farX;
  // Botão que não está num canto: deslocamento horizontal a partir da borda esquerda do pop-up
  if (offsetX !== undefined) {
    left = `calc(0% + ${Math.round(offsetX)}px)`;
    right = `calc(100% + -${Math.round(offsetX + width)}px)`;
  }
  return `inset(${top} ${right} ${bottom} ${left} round ${Math.round(r)}px)`;
}

function inferMorphCorner(style?: React.CSSProperties | any, className?: string) {
  const origin = String(style?.transformOrigin ?? '');
  const cls = className || '';
  const openUp = (style && style.bottom !== undefined && style.top === undefined)
    || /(^|\s)bottom-0(\s|$)/.test(cls)
    || origin.includes('bottom');
  const alignRight = (style && style.right !== undefined && style.left === undefined)
    || /(^|\s)right-0(\s|$)/.test(cls)
    || origin.includes('right')
    || origin.startsWith('calc(100%');
  return { openUp: Boolean(openUp), alignRight: Boolean(alignRight) };
}

export function getButtonMorphMotion(opts: {
  originWidth: number;
  originHeight: number;
  alignRight: boolean;
  openUp: boolean;
  originRadius?: number;
  originOffsetX?: number;
}) {
  const collapsed = getButtonMorphClip(opts.originWidth, opts.originHeight, opts.alignRight, opts.openUp, opts.originRadius, opts.originOffsetX);
  return {
    // A forma (clip) cresce a partir do botão; a escala com mola dá o leve "overshoot" elástico do iOS
    initial: { clipPath: collapsed, scale: 0.86, opacity: 0 },
    animate: { clipPath: MORPH_EXPANDED_CLIP, scale: 1, opacity: 1 },
    exit: {
      clipPath: collapsed,
      scale: 0.9,
      opacity: 0,
      transition: {
        clipPath: MORPH_EXIT_SPRING,
        scale: MORPH_EXIT_SPRING,
        opacity: { duration: 0.12, delay: 0.16 },
      },
    },
    transition: {
      clipPath: MORPH_SPRING,
      scale: MORPH_BOUNCE_SPRING,
      opacity: { duration: 0.12, ease: "easeOut" as const },
    },
  };
}

// Conteúdo do pop-up: surge do desfoque com um leve zoom (e some desfocando antes da forma encolher)
export const MORPH_CONTENT_MOTION = {
  initial: { opacity: 0, scale: 0.9, filter: 'blur(10px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: {
    opacity: 0,
    scale: 0.92,
    filter: 'blur(8px)',
    transition: { duration: 0.14, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
  },
  transition: {
    opacity: { duration: 0.22, delay: 0.06, ease: "easeOut" as const },
    filter: { duration: 0.28, delay: 0.04, ease: "easeOut" as const },
    scale: MORPH_BOUNCE_SPRING,
  },
};

// Variante de animação do botão gatilho: some quando o pop-up assume o lugar dele e volta quando o pop-up encolhe
// O botão cresce um pouco enquanto se funde no menu que nasce dele; ao fechar, ressurge do menu recolhido
export function morphTriggerAnimate(isOpen: boolean) {
  return isOpen
    ? { opacity: 0, scale: 1.12, pointerEvents: 'none' as const, transition: { opacity: { duration: 0.14 }, scale: MORPH_SPRING } }
    : { opacity: 1, scale: 1, pointerEvents: 'auto' as const, transition: { opacity: { duration: 0.14, delay: 0.2 }, scale: { type: 'spring' as const, stiffness: 420, damping: 26, delay: 0.18 } } };
}

type MorphPopupProps = Omit<HTMLMotionProps<'div'>, 'initial' | 'animate' | 'exit' | 'transition'> & {
  anchor?: HTMLElement | null;
  originWidth?: number;
  originHeight?: number;
  originRadius?: number;
  originOffsetX?: number;
  openUp?: boolean;
  alignRight?: boolean;
};

export const MorphPopup = React.forwardRef<HTMLDivElement, MorphPopupProps>(function MorphPopup(
  { anchor, originWidth, originHeight, originRadius, originOffsetX, openUp, alignRight, style, className, ...rest },
  ref
) {
  const corner = inferMorphCorner(style, className);
  const morph = getButtonMorphMotion({
    originWidth: originWidth ?? anchor?.offsetWidth ?? 36,
    originHeight: originHeight ?? anchor?.offsetHeight ?? 36,
    alignRight: alignRight ?? corner.alignRight,
    openUp: openUp ?? corner.openUp,
    originRadius,
    originOffsetX,
  });
  const { children, ...motionRest } = rest;
  // O wrapper herda o layout do pop-up (coluna, gap, alinhamento) para não alterar o conteúdo
  const layoutClasses = (className || '')
    .split(/\s+/)
    .filter(c => /^(gap-|gap-x-|gap-y-|items-|justify-|text-left|text-right|rtl:text-)/.test(c))
    .join(' ');
  return (
    <motion.div ref={ref} {...morph} style={style} className={className} {...motionRest}>
      <motion.div
        {...MORPH_CONTENT_MOTION}
        style={{ transformOrigin: style?.transformOrigin }}
        className={cn("flex flex-col min-h-0 flex-1 w-full", layoutClasses)}
      >
        {children as React.ReactNode}
      </motion.div>
    </motion.div>
  );
});

// ===== Abertura estilo "abrir app no iOS" =====
// O card tocado informa seu retângulo; o App expande uma camada a partir dele até a área de conteúdo
export interface ZoomOriginDetail {
  rect: { left: number; top: number; width: number; height: number };
  image?: string;
  radius: number;
  // Identifica o card (data-zoom-key) para a animação inversa ao voltar
  key?: string;
}

export function emitZoomOrigin(el: Element | null | undefined, image?: string, radius = 24, key?: string) {
  if (!el || typeof window === 'undefined') return;
  const r = el.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return;
  window.dispatchEvent(new CustomEvent<ZoomOriginDetail>('zoom-origin', {
    detail: { rect: { left: r.left, top: r.top, width: r.width, height: r.height }, image, radius, key },
  }));
}

// Troca de conteúdo como nos menus do iOS: o pop-up se reforma (tamanho com mola) enquanto o conteúdo
// antigo se dissolve com leve desfoque e o novo surge do mesmo jeito, sem deslizar para os lados
export const popupMorphContentVariants = {
  enter: (_custom: any) => ({
    opacity: 0,
    scale: 0.96,
    x: 0,
    filter: 'blur(6px)',
    position: 'relative' as const,
  }),
  center: {
    opacity: 1,
    scale: 1,
    x: 0,
    filter: 'blur(0px)',
    position: 'relative' as const,
  },
  exit: (custom: any) => {
    const openUp = typeof custom === 'object' ? Boolean(custom?.openUp) : false;
    const alignRight = typeof custom === 'object' ? Boolean(custom?.alignRight) : false;
    return {
      opacity: 0,
      scale: 1.03,
      x: 0,
      filter: 'blur(6px)',
      position: 'absolute' as const,
      ...(openUp ? { bottom: 0 } : { top: 0 }),
      ...(alignRight ? { right: 0 } : { left: 0 }),
      pointerEvents: 'none' as const,
    };
  },
};

export function MorphMeasuredContent({
  itemKey,
  activeKeyRef,
  onResize,
  style,
  className,
  children,
}: {
  itemKey: string;
  activeKeyRef: React.MutableRefObject<string>;
  onResize: (height: number) => void;
  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onResizeRef = useRef(onResize);
  onResizeRef.current = onResize;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (activeKeyRef.current !== itemKey) return;
      const h = el.offsetHeight;
      if (h > 0) {
        onResizeRef.current(h);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [itemKey, activeKeyRef]);

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}

export function PopupMorphContainer({
  activeKey,
  direction,
  targetWidth,
  targetRadius = 24,
  openUp,
  style,
  className = "",
  children,
  ambientBg,
  originWidth = 32,
  originHeight = 32,
}: {
  activeKey: string;
  direction: 1 | -1;
  targetWidth: number;
  targetRadius?: number;
  openUp?: boolean;
  style?: React.CSSProperties;
  className?: string;
  children: React.ReactNode;
  ambientBg?: React.ReactNode;
  originWidth?: number;
  originHeight?: number;
}) {
  // Celular: menus mais largos (sem quebrar o texto das opções) e com cantos bem arredondados, como no iOS
  const compactPopup = useCompactPopups();
  if (compactPopup && typeof window !== 'undefined') {
    targetWidth = Math.min(Math.max(targetWidth, 290), window.innerWidth - 32);
    targetRadius = Math.max(targetRadius, 30);
  } else if (typeof window !== 'undefined') {
    // Computador: 20% mais largos, para os textos das opções não quebrarem linha
    targetWidth = Math.min(Math.round(targetWidth * 1.2), window.innerWidth - 32);
  }
  // Mesmo critério do MorphPopup: considera right/bottom do style (getButtonCoverPopupStyle) e o transformOrigin
  const inferredCorner = inferMorphCorner(style, className);
  const isOpeningUp = openUp !== undefined ? openUp : inferredCorner.openUp;
  const isAlignRight = inferredCorner.alignRight;

  const activeKeyRef = useRef(activeKey);
  activeKeyRef.current = activeKey;
  const prevKeyRef = useRef(activeKey);
  const lastHeightRef = useRef<number | 'auto'>('auto');
  const isKeyMorphingRef = useRef(false);
  const [morphHeight, setMorphHeight] = useState<number | 'auto'>('auto');
  const [isKeyMorphing, setIsKeyMorphing] = useState(false);
  const [enableWidthSpring, setEnableWidthSpring] = useState(false);

  const justChangedKey = prevKeyRef.current !== activeKey;
  if (justChangedKey) {
    isKeyMorphingRef.current = true;
  }

  const handleChildResize = useCallback((h: number) => {
    lastHeightRef.current = h;
    setMorphHeight(prev => (prev === h ? prev : h));
  }, []);

  useLayoutEffect(() => {
    if (prevKeyRef.current !== activeKey) {
      prevKeyRef.current = activeKey;
      isKeyMorphingRef.current = true;
      setIsKeyMorphing(true);
      const timer = setTimeout(() => {
        isKeyMorphingRef.current = false;
        setIsKeyMorphing(false);
      }, 560);
      return () => clearTimeout(timer);
    }
  }, [activeKey]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEnableWidthSpring(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const outerStyle: React.CSSProperties = {
    '--winblue': 'var(--app-winblue, #0086F0)',
    '--winblue-rgb': 'var(--app-winblue-rgb, 0, 134, 240)',
    '--color-winblue': 'var(--app-winblue, #0086F0)',
    ...style,
  } as React.CSSProperties;
  delete outerStyle.width;

  // Abre a partir do botão de três pontinhos (mesmo canto ancorado) e fecha de volta nele
  const openMorph = getButtonMorphMotion({
    originWidth,
    originHeight,
    alignRight: isAlignRight,
    openUp: isOpeningUp,
  });

  const animatedHeight = justChangedKey
    ? lastHeightRef.current
    : isKeyMorphing
      ? morphHeight
      : 'auto';

  return (
    <motion.div
      data-popup-content="true"
      initial={{ ...openMorph.initial, borderRadius: targetRadius }}
      animate={{ ...openMorph.animate, borderRadius: targetRadius }}
      exit={openMorph.exit}
      transition={{
        ...openMorph.transition,
        borderRadius: MORPH_SPRING,
      }}
      style={outerStyle}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "bg-card/95 backdrop-blur-3xl border border-[var(--button-secondary-bg)] shadow-2xl flex flex-col text-left overflow-hidden",
        className
      )}
    >
      {ambientBg}
      <motion.div
        initial={MORPH_CONTENT_MOTION.initial}
        exit={MORPH_CONTENT_MOTION.exit}
        style={{ transformOrigin: outerStyle.transformOrigin }}
        animate={{ ...MORPH_CONTENT_MOTION.animate, width: targetWidth, height: animatedHeight }}
        transition={{
          ...MORPH_CONTENT_MOTION.transition,
          width: enableWidthSpring ? MORPH_BOUNCE_SPRING : { duration: 0 },
          height:
            !justChangedKey && isKeyMorphing
              ? MORPH_BOUNCE_SPRING
              : { duration: 0 },
        }}
        className="relative z-10 overflow-hidden will-change-[width,height]"
      >
        <AnimatePresence initial={false} custom={{ dir: direction, openUp: isOpeningUp, alignRight: isAlignRight }}>
          <motion.div
            key={activeKey}
            variants={popupMorphContentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              opacity: { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] },
              filter: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
              scale: MORPH_BOUNCE_SPRING,
              x: MORPH_SPRING,
            }}
            className="w-full"
          >
            <MorphMeasuredContent
              itemKey={activeKey}
              activeKeyRef={activeKeyRef}
              onResize={handleChildResize}
              style={{ width: `${targetWidth}px` }}
            >
              {children}
            </MorphMeasuredContent>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export const subMorphVariants = {
  enter: (dir: number) => ({
    opacity: 0,
    scale: 0.97,
    y: dir > 0 ? -5 : 5,
    position: 'relative' as const,
  }),
  center: {
    opacity: 1,
    scale: 1,
    y: 0,
    position: 'relative' as const,
  },
  exit: (dir: number) => ({
    opacity: 0,
    scale: 0.97,
    y: dir > 0 ? 5 : -5,
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    pointerEvents: 'none' as const,
  }),
};

export function SmoothSubMorph({
  activeKey,
  direction = 1,
  className = "",
  children,
}: {
  activeKey: string;
  direction?: 1 | -1;
  className?: string;
  children: React.ReactNode;
}) {
  const activeKeyRef = useRef(activeKey);
  activeKeyRef.current = activeKey;
  const prevKeyRef = useRef(activeKey);
  const [isMorphing, setIsMorphing] = useState(false);
  const [height, setHeight] = useState<number | 'auto'>('auto');
  const [enableSpring, setEnableSpring] = useState(false);

  const handleResize = useCallback((h: number) => {
    setHeight(prev => (prev === h ? prev : h));
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEnableSpring(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (prevKeyRef.current !== activeKey) {
      prevKeyRef.current = activeKey;
      setIsMorphing(true);
      const t = setTimeout(() => setIsMorphing(false), 240);
      return () => clearTimeout(t);
    }
  }, [activeKey]);

  return (
    <motion.div
      animate={{ height: isMorphing ? height : 'auto' }}
      transition={
        enableSpring
          ? { height: { type: "spring", stiffness: 520, damping: 38, mass: 0.55 } }
          : { height: { duration: 0 } }
      }
      className={cn("relative w-full shrink-0", isMorphing ? "overflow-hidden" : "overflow-visible", className)}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={activeKey}
          custom={direction}
          variants={subMorphVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            opacity: { duration: 0.14, ease: [0.22, 1, 0.36, 1] },
            scale: { type: "spring", stiffness: 520, damping: 38, mass: 0.55 },
            y: { type: "spring", stiffness: 520, damping: 38, mass: 0.55 },
          }}
          className="w-full overflow-visible"
        >
          <MorphMeasuredContent
            itemKey={activeKey}
            activeKeyRef={activeKeyRef}
            onResize={handleResize}
            className="w-full overflow-visible"
          >
            {children}
          </MorphMeasuredContent>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export function checkChapterMenuShouldOpenUp(bottomCoord: number, requiredSpace: number = 320): boolean {
  if (typeof window === 'undefined') return false;
  const miniEl = document.getElementById('mini-player');
  let bottomLimit = window.innerHeight - 12;
  if (miniEl) {
    const mRect = miniEl.getBoundingClientRect();
    if (mRect.top > 0 && mRect.top < window.innerHeight && mRect.height > 0) {
      bottomLimit = mRect.top - 8;
    }
  }
  return (bottomLimit - bottomCoord < requiredSpace) || (bottomCoord > bottomLimit * 0.55);
}

export function checkIsLeftEdgeCard(triggerEl: HTMLElement | null): boolean {
  if (!triggerEl || typeof window === 'undefined') return false;

  const cardEl = triggerEl.classList.contains('group') ? triggerEl : (triggerEl.closest('[class*="group"]') as HTMLElement) || (triggerEl.closest('.group') as HTMLElement);
  const rect = triggerEl.getBoundingClientRect();

  if (cardEl && cardEl.parentElement) {
    const cardRect = cardEl.getBoundingClientRect();
    const parentRect = cardEl.parentElement.getBoundingClientRect();
    if ((cardRect.left - parentRect.left) < 55) {
      return true;
    }
  }

  const sidebarEl = typeof document !== 'undefined' ? document.querySelector('aside') : null;
  let minLeftBoundary = 16;
  if (sidebarEl) {
    const sRect = sidebarEl.getBoundingClientRect();
    if (sRect.width > 0 && sRect.right > 0 && sRect.right < window.innerWidth) {
      minLeftBoundary = sRect.right + 12;
    }
  }

  const maxTransformWidth = 320;
  if ((rect.right - maxTransformWidth) < minLeftBoundary) {
    return true;
  }

  const contentWidth = window.innerWidth - minLeftBoundary;
  if ((rect.left - minLeftBoundary) < contentWidth * 0.3) {
    return true;
  }

  return false;
}

export function getSmartPopupStyle(
  triggerEl: HTMLElement | null,
  width: number = 224,
  height: number = 280,
  maxPotentialWidth?: number,
  maxPotentialHeight?: number,
  preferredAlign: 'auto' | 'left' | 'right' = 'auto'
): React.CSSProperties {
  if (!triggerEl || typeof window === 'undefined') {
    return { position: 'fixed', zIndex: 9999, width: `${width}px` };
  }

  const rect = triggerEl.getBoundingClientRect();
  const margin = 12;

  const sidebarEl = typeof document !== 'undefined' ? document.querySelector('aside') : null;
  const isInsideSidebar = sidebarEl ? sidebarEl.contains(triggerEl) : false;
  let leftBoundary = margin;
  if (!isInsideSidebar && sidebarEl) {
    const sRect = sidebarEl.getBoundingClientRect();
    if (sRect.width > 0 && sRect.right > 0 && sRect.right < window.innerWidth) {
      if (rect.left >= sRect.right - 8) {
        leftBoundary = sRect.right + 8;
      }
    }
  }
  const rightBoundary = window.innerWidth - margin;

  const miniplayerEl = typeof document !== 'undefined' ? document.getElementById('mini-player') : null;
  const isInsideMiniplayer = miniplayerEl ? miniplayerEl.contains(triggerEl) : false;

  let bottomBoundary: number;
  if (isInsideMiniplayer) {
    bottomBoundary = rect.top - 6;
  } else if (miniplayerEl) {
    const mRect = miniplayerEl.getBoundingClientRect();
    bottomBoundary = mRect.top > 0 && mRect.top < window.innerHeight && mRect.height > 0
      ? mRect.top - 8
      : window.innerHeight - margin;
  } else {
    bottomBoundary = window.innerHeight - margin;
  }

  const topBoundary = margin;
  const checkHeight = Math.max(height, maxPotentialHeight || height);
  const checkWidth = Math.max(width, maxPotentialWidth || width);

  let top: number;
  let originY: 'top' | 'bottom' = 'top';

  if (isInsideMiniplayer) {
    top = Math.max(topBoundary, rect.top - height - 8);
    originY = 'bottom';
  } else {
    const spaceBelow = bottomBoundary - rect.bottom - 6;
    const spaceAbove = rect.top - topBoundary - 6;

    let openUp = false;
    if (spaceBelow < checkHeight + 8) {
      openUp = true;
    } else if (spaceAbove >= checkHeight && (rect.bottom > bottomBoundary * 0.55 || rect.top > window.innerHeight * 0.55)) {
      openUp = true;
    } else if (spaceBelow < spaceAbove && spaceAbove >= checkHeight) {
      openUp = true;
    } else if (spaceBelow < checkHeight && spaceAbove > spaceBelow) {
      openUp = true;
    }

    if (openUp) {
      top = Math.max(topBoundary, rect.top - height - 6);
      originY = 'bottom';
    } else {
      top = rect.bottom + 6;
      if (top + height > bottomBoundary) {
        top = Math.max(topBoundary, bottomBoundary - height);
      }
      originY = 'top';
    }
  }

  let left: number;
  let originX: 'left' | 'right' = 'right';

  const alignRightLeft = rect.right - width;
  const alignLeftLeft = rect.left;

  if (preferredAlign === 'left') {
    if (alignLeftLeft >= leftBoundary && alignLeftLeft + checkWidth <= rightBoundary) {
      left = alignLeftLeft;
      originX = 'left';
    } else if (rect.right - checkWidth >= leftBoundary && rect.right <= rightBoundary) {
      left = alignRightLeft;
      originX = 'right';
    } else {
      left = Math.min(Math.max(leftBoundary, rect.left), rightBoundary - width);
      originX = 'left';
    }
  } else if (preferredAlign === 'right') {
    if (rect.right - checkWidth >= leftBoundary && rect.right <= rightBoundary) {
      left = alignRightLeft;
      originX = 'right';
    } else if (alignLeftLeft >= leftBoundary && alignLeftLeft + checkWidth <= rightBoundary) {
      left = alignLeftLeft;
      originX = 'left';
    } else {
      left = Math.max(leftBoundary, Math.min(rect.right - width, rightBoundary - width));
      originX = 'right';
    }
  } else {
    if (rect.right - checkWidth >= leftBoundary && rect.right <= rightBoundary) {
      left = alignRightLeft;
      originX = 'right';
    } else if (alignLeftLeft >= leftBoundary && alignLeftLeft + checkWidth <= rightBoundary) {
      left = alignLeftLeft;
      originX = 'left';
    } else {
      if (rect.left < (leftBoundary + rightBoundary) / 2) {
        left = Math.min(Math.max(leftBoundary, rect.left), rightBoundary - width);
        originX = 'left';
      } else {
        left = Math.max(leftBoundary, Math.min(rect.right - width, rightBoundary - width));
        originX = 'right';
      }
    }
  }

  return {
    position: 'fixed',
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
    width: `${width}px`,
    zIndex: 9999,
    transformOrigin: `${originY} ${originX}`,
  };
}

interface PopupAnchorState {
  openUp: boolean;
  alignSide: 'left' | 'right';
  anchorRight: number;
  anchorLeft: number;
  anchorTop: number;
  anchorBottom: number;
}
const buttonCoverAnchorCache = new WeakMap<HTMLElement, PopupAnchorState>();

export function clearButtonCoverAnchorCache(triggerEl?: HTMLElement | null) {
  if (triggerEl) {
    buttonCoverAnchorCache.delete(triggerEl);
  }
}

export function getButtonCoverPopupStyle(
  triggerEl: HTMLElement | null,
  width: number,
  estimatedHeight: number,
  preferredAlign: 'auto' | 'left' | 'right' = 'auto',
  fixedOpenUp?: boolean
): React.CSSProperties {
  // Computador: os pop-ups são 20% mais largos (mesma conta do CSS e do PopupMorphContainer)
  if (typeof window !== 'undefined' && !window.matchMedia?.('(max-width: 1023px)').matches) {
    width = Math.round(width * 1.2);
  }
  if (!triggerEl || typeof window === 'undefined') {
    return { position: 'fixed', zIndex: 9999, width: `${width}px` };
  }

  const rawRect = triggerEl.getBoundingClientRect();
  const centerX = rawRect.left + rawRect.width / 2;
  const centerY = rawRect.top + rawRect.height / 2;
  const unscaledW = triggerEl.offsetWidth || rawRect.width;
  const unscaledH = triggerEl.offsetHeight || rawRect.height;
  const rect = {
    left: centerX - unscaledW / 2,
    right: centerX + unscaledW / 2,
    top: centerY - unscaledH / 2,
    bottom: centerY + unscaledH / 2,
    width: unscaledW,
    height: unscaledH,
  };

  const margin = 12;
  const topBoundary = margin;

  const sidebarEl = typeof document !== 'undefined' ? document.querySelector('aside') : null;
  const isInsideSidebar = sidebarEl ? sidebarEl.contains(triggerEl) : false;
  let minLeftBoundary = margin;
  if (!isInsideSidebar && sidebarEl) {
    const sRect = sidebarEl.getBoundingClientRect();
    if (sRect.width > 0 && sRect.right > 0 && sRect.right < window.innerWidth) {
      if (rect.left >= sRect.right - 8) {
        minLeftBoundary = sRect.right + 8;
      }
    }
  }

  const miniplayerEl = typeof document !== 'undefined' ? document.getElementById('mini-player') : null;
  const isInsideMiniplayer = miniplayerEl ? miniplayerEl.contains(triggerEl) : false;

  let bottomBoundary = window.innerHeight - margin;
  if (!isInsideMiniplayer && miniplayerEl) {
    const mRect = miniplayerEl.getBoundingClientRect();
    if (mRect.top > 0 && mRect.top < window.innerHeight && mRect.height > 0) {
      bottomBoundary = mRect.top - 8;
    }
  }
  if (bottomBoundary < topBoundary + 100) {
    bottomBoundary = window.innerHeight - margin;
  }

  const actualWidth = Math.min(width, window.innerWidth - margin * 2);
  let cachedAnchor = buttonCoverAnchorCache.get(triggerEl);
  let alignSide: 'left' | 'right';
  let openUp: boolean;

  if (cachedAnchor) {
    alignSide = cachedAnchor.alignSide;
    openUp = fixedOpenUp !== undefined ? fixedOpenUp : cachedAnchor.openUp;
  } else {
    const potentialMaxHeight = Math.max(estimatedHeight, 320);

    if (preferredAlign === 'left') {
      alignSide = 'left';
      if (rect.left + actualWidth > window.innerWidth - margin && (rect.right - actualWidth >= minLeftBoundary)) {
        alignSide = 'right';
      }
    } else if (preferredAlign === 'right') {
      alignSide = 'right';
      if (rect.right - actualWidth < minLeftBoundary && (rect.left + actualWidth <= window.innerWidth - margin)) {
        alignSide = 'left';
      }
    } else {
      if (rect.right - actualWidth < minLeftBoundary && (rect.left + actualWidth <= window.innerWidth - margin)) {
        alignSide = 'left';
      } else if (rect.left + actualWidth <= window.innerWidth - margin && rect.left < window.innerWidth / 3) {
        alignSide = 'left';
      } else {
        alignSide = 'right';
      }
    }

    const spaceBelow = bottomBoundary - rect.bottom - 4;
    const spaceAbove = rect.top - topBoundary - 4;

    if (fixedOpenUp !== undefined) {
      openUp = fixedOpenUp;
    } else if (isInsideMiniplayer) {
      openUp = true;
    } else if (spaceBelow < potentialMaxHeight + 8) {
      openUp = true;
    } else if (spaceAbove >= potentialMaxHeight && (rect.bottom > bottomBoundary * 0.55 || rect.top > window.innerHeight * 0.55)) {
      openUp = true;
    } else if (spaceBelow < spaceAbove && spaceAbove >= potentialMaxHeight) {
      openUp = true;
    } else if (spaceBelow < potentialMaxHeight && spaceAbove > spaceBelow) {
      openUp = true;
    } else {
      openUp = false;
    }

    cachedAnchor = {
      openUp,
      alignSide,
      anchorRight: rect.right,
      anchorLeft: rect.left,
      anchorTop: rect.top,
      anchorBottom: rect.bottom,
    };
    buttonCoverAnchorCache.set(triggerEl, cachedAnchor);
  }

  const anchorRight = cachedAnchor.anchorRight;
  const anchorLeft = cachedAnchor.anchorLeft;
  const anchorTop = cachedAnchor.anchorTop;
  const anchorBottom = cachedAnchor.anchorBottom;
  const anchorCenterX = (anchorLeft + anchorRight) / 2;

  const styleResult: React.CSSProperties = {
    position: 'fixed',
    width: `${width}px`,
    zIndex: 9999,
  };

  let originXStr: string;
  if (alignSide === 'right') {
    const rightEdge = Math.min(window.innerWidth - margin, Math.max(minLeftBoundary + actualWidth, anchorRight));
    styleResult.right = `${Math.round(window.innerWidth - rightEdge)}px`;
    const distFromRight = Math.max(12, Math.round(rightEdge - anchorCenterX));
    originXStr = `calc(100% - ${distFromRight}px)`;
  } else {
    let leftEdge = anchorLeft;
    if (window.innerWidth - actualWidth - margin >= minLeftBoundary) {
      leftEdge = Math.max(minLeftBoundary, Math.min(window.innerWidth - actualWidth - margin, leftEdge));
    } else {
      leftEdge = Math.max(margin, Math.min(window.innerWidth - actualWidth - margin, leftEdge));
    }
    styleResult.left = `${Math.round(leftEdge)}px`;
    const distFromLeft = Math.max(12, Math.round(anchorCenterX - leftEdge));
    originXStr = `${distFromLeft}px`;
  }

  let originYStr: string;
  if (openUp) {
    const bottomEdge = Math.min(bottomBoundary, anchorBottom);
    styleResult.bottom = `${Math.round(window.innerHeight - bottomEdge)}px`;
    const maxH = bottomEdge - topBoundary;
    if (maxH > 0) {
      styleResult.maxHeight = `${Math.round(maxH)}px`;
    }
    originYStr = 'bottom';
  } else {
    const topEdge = Math.max(topBoundary, Math.min(bottomBoundary - 120, anchorTop));
    styleResult.top = `${Math.round(topEdge)}px`;
    const maxH = bottomBoundary - topEdge;
    if (maxH > 0) {
      styleResult.maxHeight = `${Math.round(maxH)}px`;
    }
    originYStr = 'top';
  }

  styleResult.transformOrigin = `${originXStr} ${originYStr}`;
  return styleResult;
}
