import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { PopupMorphContainer } from './Popovers';

// ===== Versão mobile: menu de contexto estilo iOS (toque longo) =====

const MOBILE_QUERY = '(max-width: 1023px)';

export function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(MOBILE_QUERY).matches;
}

export function isCoarsePointer(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
}

// Celular deitado (pouca altura): telas reorganizadas lado a lado
export const LANDSCAPE_PHONE_QUERY = '(max-width: 1023px) and (orientation: landscape) and (max-height: 600px)';
export function useIsLandscapePhone(): boolean {
  const get = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(LANDSCAPE_PHONE_QUERY).matches;
  const [land, setLand] = useState(get);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(LANDSCAPE_PHONE_QUERY);
    const onChange = () => setLand(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return land;
}

// Telas de toque (celulares e tablets, inclusive iPad deitado)
export function useIsTouchDevice(): boolean {
  const [touch, setTouch] = useState(isCoarsePointer);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(pointer: coarse)');
    const onChange = () => setTouch(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return touch;
}

// true abaixo do breakpoint md (onde o app usa a interface mobile)
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(isMobileViewport);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return isMobile;
}

// Miniplayer simplificado: interface mobile ou telas de toque baixas (ex.: iPad mini deitado)
const COMPACT_PLAYER_QUERY = '(max-width: 1023px), (pointer: coarse) and (max-height: 767px)';
export function useIsCompactPlayer(): boolean {
  const get = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(COMPACT_PLAYER_QUERY).matches;
  const [compact, setCompact] = useState(get);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(COMPACT_PLAYER_QUERY);
    const onChange = () => setCompact(mq.matches);
    onChange();
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return compact;
}

// Toque longo (~0,45s) em telas de toque: chama onLongPress com o elemento e cancela o clique seguinte
export function useLongPress(onLongPress: (el: HTMLElement) => void, delay = 450) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);
  const callbackRef = useRef(onLongPress);
  callbackRef.current = onLongPress;

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    startRef.current = null;
  };

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse') return;
    firedRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY };
    const el = e.currentTarget;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      timerRef.current = null;
      try { navigator.vibrate?.(10); } catch {}
      callbackRef.current(el);
    }, delay);
  }, [delay]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const st = startRef.current;
    if (!st) return;
    if (Math.abs(e.clientX - st.x) > 8 || Math.abs(e.clientY - st.y) > 8) clear();
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (firedRef.current) {
      firedRef.current = false;
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: clear,
    onPointerCancel: clear,
    onClickCapture,
  };
}

type Rect = { left: number; top: number; width: number; height: number; bottom: number };

// Áreas seguras do aparelho (barra de status, indicador de início e recortes laterais), em pixels
export function getSafeInsets(): { top: number; right: number; bottom: number; left: number } {
  if (typeof document === 'undefined') return { top: 0, right: 0, bottom: 0, left: 0 };
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;inset:0;visibility:hidden;pointer-events:none;padding:var(--safe-top) var(--safe-right) env(safe-area-inset-bottom) var(--safe-left);';
  document.body.appendChild(probe);
  const cs = getComputedStyle(probe);
  const out = {
    top: parseFloat(cs.paddingTop) || 0,
    right: parseFloat(cs.paddingRight) || 0,
    bottom: parseFloat(cs.paddingBottom) || 0,
    left: parseFloat(cs.paddingLeft) || 0,
  };
  probe.remove();
  return out;
}

const LIFT_SPRING = { type: 'spring' as const, stiffness: 420, damping: 30, mass: 0.6 };

export function MobileContextMenu({
  open,
  rect,
  preview,
  onClose,
  activeKey,
  direction,
  targetWidth,
  targetRadius,
  estimatedMenuHeight = 340,
  sourceEl,
  children,
}: {
  sourceEl?: HTMLElement | null;
  open: boolean;
  rect: DOMRect | null;
  preview: React.ReactNode;
  onClose: () => void;
  activeKey: string;
  direction: 1 | -1;
  targetWidth: number;
  targetRadius: number;
  estimatedMenuHeight?: number;
  children: React.ReactNode;
}) {
  // Guarda o último retângulo para a animação de saída
  const lastRectRef = useRef<Rect | null>(null);
  if (rect) {
    lastRectRef.current = { left: rect.left, top: rect.top, width: rect.width, height: rect.height, bottom: rect.bottom };
  }
  const r = lastRectRef.current;
  // Altura real do menu (medida depois de aberto) para alinhá-lo ao item sem sair da tela
  const [measuredMenuH, setMeasuredMenuH] = useState<number | null>(null);
  const menuContentRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) { setMeasuredMenuH(null); return; }
    const el = menuContentRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setMeasuredMenuH(el.offsetHeight + 2));
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, activeKey]);
  // Posição do item em destaque e do menu: tudo dentro da tela (itens perto da borda direita
  // ou cortados numa linha com rolagem horizontal são trazidos para dentro, e o menu se alinha a eles)
  let layout: { shiftX: number; shiftY: number; menuTop: number; menuLeft: number; alignRight: boolean; menuW: number } | null = null;
  const isSideLayout = typeof window !== 'undefined' && !!window.matchMedia?.(LANDSCAPE_PHONE_QUERY).matches;
  if (r) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const safe = getSafeInsets();
    const margin = isSideLayout ? 12 : 16;
    // Espaço entre o item em destaque e o menu (o item cresce 4% ao se destacar, então soma-se essa folga)
    const gap = (isSideLayout ? 18 : 16) + Math.round((isSideLayout ? r.width : r.height) * 0.02);
    const minX = margin + safe.left;
    const maxX = vw - margin - safe.right;
    const minY = margin + safe.top;
    const maxY = vh - margin - safe.bottom;
    const menuW = Math.min(Math.max(targetWidth, 290), maxX - minX);
    const menuH = measuredMenuH ?? (isSideLayout ? Math.min(estimatedMenuHeight, 290) : Math.max(estimatedMenuHeight, 290));
    let shiftX = 0;
    if (r.left < minX) shiftX = minX - r.left;
    if (r.left + shiftX + r.width > maxX) shiftX = (maxX - r.width) - r.left;
    const left = r.left + shiftX;
    const rightEdge = left + r.width;
    if (isSideLayout) {
      // Celular deitado: o menu abre ao lado do item (à direita; se não couber, à esquerda)
      let shiftY = 0;
      const itemH = Math.min(r.height, maxY - minY);
      if (r.top < minY) shiftY = minY - r.top;
      if (r.top + shiftY + itemH > maxY) shiftY = (maxY - itemH) - r.top;
      const toRight = rightEdge + gap;
      const fitsRight = toRight + menuW <= maxX;
      const menuLeft = fitsRight ? toRight : Math.max(minX, left - gap - menuW);
      // Menu centralizado na altura do item (sem sair da tela)
      const itemCenter = r.top + shiftY + itemH / 2;
      const menuTop = Math.max(minY, Math.min(itemCenter - menuH / 2, maxY - Math.min(menuH, maxY - minY)));
      layout = { shiftX, shiftY, menuTop, menuLeft, alignRight: !fitsRight, menuW };
    } else {
      const total = r.height + gap + menuH;
      let shiftY = 0;
      // Se o item + menu não cabem abaixo, o item sobe (como no iOS) até o conjunto caber na tela
      if (r.top + total > maxY) shiftY = (maxY - total) - r.top;
      if (r.top + shiftY < minY + 40) shiftY = minY + 40 - r.top;
      const menuTop = Math.min(r.bottom + shiftY + gap, maxY - 120);
      // Item na metade direita da tela: o menu se alinha pela direita do item (como no iOS)
      const alignRight = left + r.width / 2 > vw / 2;
      const desired = alignRight ? rightEdge - menuW : left;
      const menuLeft = Math.max(minX, Math.min(desired, maxX - menuW));
      layout = { shiftX, shiftY, menuTop, menuLeft, alignRight, menuW };
    }
  }

  // O item some do fundo enquanto aparece em destaque com o menu
  useEffect(() => {
    if (!open || !sourceEl) return;
    const el = sourceEl;
    el.style.visibility = 'hidden';
    return () => {
      setTimeout(() => { el.style.visibility = ''; }, 200);
    };
  }, [open, sourceEl]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && r && layout && (
        <React.Fragment key="mobile-context-menu">
          {/* Fundo desfocado e escurecido: toque fora fecha */}
          <motion.div
            key="ctx-backdrop"
            data-popup-content="true"
            className="fixed inset-0 z-[9990] bg-black/20 dark:bg-black/45 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            transition={{ duration: 0.2 }}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          />
          {/* O item pressionado se destaca da interface */}
          <motion.div
            key="ctx-preview"
            data-popup-content="true"
            className="fixed z-[9991] pointer-events-none"
            style={{ left: r.left, top: r.top, width: r.width, transformOrigin: 'center center' }}
            initial={{ scale: 1, y: 0 }}
            animate={{ scale: 1.04, x: layout.shiftX, y: layout.shiftY }}
            exit={{ scale: 1, x: 0, y: 0, opacity: 0, transition: { duration: 0.2 } }}
            transition={LIFT_SPRING}
          >
            {preview}
          </motion.div>
          <PopupMorphContainer
            key="ctx-menu"
            activeKey={activeKey}
            direction={direction}
            targetWidth={layout.menuW}
            targetRadius={targetRadius}
            originWidth={Math.min(r.width, 160)}
            originHeight={40}
            style={layout.alignRight
              ? { position: 'fixed', top: layout.menuTop, right: window.innerWidth - (layout.menuLeft + layout.menuW), zIndex: 9992, transformOrigin: 'top right' }
              : { position: 'fixed', top: layout.menuTop, left: layout.menuLeft, zIndex: 9992, transformOrigin: 'top left' }}
            className=""
          >
            <div ref={menuContentRef}>{children}</div>
          </PopupMorphContainer>
        </React.Fragment>
      )}
    </AnimatePresence>,
    document.body
  );
}

// Classe aplicada às grades de seções: no mobile vira uma linha com rolagem horizontal
export const MOBILE_ROW_CLASS = 'mobile-row';
